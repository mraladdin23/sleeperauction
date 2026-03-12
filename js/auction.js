// ─────────────────────────────────────────────────────────────
//  AUCTION ENGINE  (Firebase-backed, real-time)
// ─────────────────────────────────────────────────────────────

const Auction = (() => {

  const DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

  // ── Firebase paths ──────────────────────────────────────
  function auctionsRef(leagueId)       { return db.ref(`leagues/${leagueId}/auctions`); }
  function auctionRef(leagueId, id)    { return db.ref(`leagues/${leagueId}/auctions/${id}`); }
  function faabOverridesRef(leagueId)  { return db.ref(`leagues/${leagueId}/faabOverrides`); }

  // ── Subscribe to live auction updates ───────────────────
  function subscribe(leagueId, callback) {
    auctionsRef(leagueId).on('value', snap => {
      const data = snap.val() || {};
      callback(Object.values(data));
    });
  }

  function unsubscribe(leagueId) {
    auctionsRef(leagueId).off();
  }

  function subscribeFaabOverrides(leagueId, callback) {
    faabOverridesRef(leagueId).on('value', snap => callback(snap.val() || {}));
  }

  // ── Create a new auction (nomination) ───────────────────
  async function nominate(leagueId, playerId, rosterId, maxBid) {
    const id = 'auc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const auction = {
      id,
      playerId,
      nominatedBy: rosterId,
      startTime: Date.now(),
      expiresAt: Date.now() + DURATION_MS,
      bids: [{ rosterId, maxBid, timestamp: Date.now() }],
      processed: false,
    };
    await auctionRef(leagueId, id).set(auction);
    return auction;
  }

  // ── Place / update a bid ─────────────────────────────────
  async function placeBid(leagueId, auctionId, rosterId, maxBid) {
    const ref = auctionRef(leagueId, auctionId);

    // Transactional update to avoid race conditions
    const result = await ref.transaction(current => {
      if (!current) return; // auction doesn't exist

      // Append the new bid
      const bids = current.bids ? Object.values(current.bids) : [];
      bids.push({ rosterId, maxBid, timestamp: Date.now() });
      current.bids = bids;

      // Reset the timer
      current.expiresAt = Date.now() + DURATION_MS;

      return current;
    });

    if (!result.committed) throw new Error('Bid failed — please try again.');
    return result.snapshot.val();
  }

  // ── Mark auction as processed ────────────────────────────
  async function markProcessed(leagueId, auctionId) {
    await auctionRef(leagueId, auctionId).update({ processed: true });
  }

  // ── FAAB overrides ───────────────────────────────────────
  async function setFaabOverride(leagueId, rosterId, value) {
    await faabOverridesRef(leagueId).update({ [rosterId]: value });
  }

  async function clearFaabOverride(leagueId, rosterId) {
    await faabOverridesRef(leagueId).child(String(rosterId)).remove();
  }

  // ── Reset ALL data ───────────────────────────────────────
  async function resetAll(leagueId) {
    await db.ref(`leagues/${leagueId}`).remove();
  }

  // ── Proxy bid computation ────────────────────────────────
  // Returns { rosterId, displayBid }
  function computeLeadingBid(auction) {
    const bids = Array.isArray(auction.bids)
      ? auction.bids
      : Object.values(auction.bids || {});

    if (!bids.length) return { rosterId: null, displayBid: 0 };

    // Highest max per roster
    const maxByRoster = {};
    bids.forEach(b => {
      if (!maxByRoster[b.rosterId] || b.maxBid > maxByRoster[b.rosterId]) {
        maxByRoster[b.rosterId] = b.maxBid;
      }
    });

    const entries = Object.entries(maxByRoster)
      .map(([id, max]) => ({ rosterId: parseInt(id), maxBid: max }))
      .sort((a, b) => b.maxBid - a.maxBid);

    if (entries.length === 1) return { rosterId: entries[0].rosterId, displayBid: entries[0].maxBid };

    const winner = entries[0];
    const second = entries[1];
    return {
      rosterId: winner.rosterId,
      displayBid: Math.min(winner.maxBid, second.maxBid + 1),
    };
  }

  // ── Get current user's max bid on an auction ─────────────
  function getMyMaxBid(auction, rosterId) {
    const bids = Array.isArray(auction.bids)
      ? auction.bids
      : Object.values(auction.bids || {});
    const mine = bids.filter(b => b.rosterId === rosterId);
    return mine.length ? Math.max(...mine.map(b => b.maxBid)) : 0;
  }

  // ── FAAB committed in active auctions ────────────────────
  function getCommittedFaab(auctions, rosterId) {
    const now = Date.now();
    return auctions
      .filter(a => !a.processed && a.expiresAt > now)
      .reduce((sum, a) => sum + getMyMaxBid(a, rosterId), 0);
  }

  return {
    DURATION_MS,
    subscribe,
    unsubscribe,
    subscribeFaabOverrides,
    nominate,
    placeBid,
    markProcessed,
    setFaabOverride,
    clearFaabOverride,
    resetAll,
    computeLeadingBid,
    getMyMaxBid,
    getCommittedFaab,
  };
})();
