// ─────────────────────────────────────────────────────────────
//  AUCTION ENGINE  (Firebase-backed, real-time)
// ─────────────────────────────────────────────────────────────

const Auction = (() => {

  const DURATION_MS = 8 * 60 * 60 * 1000; // 8 active hours

  // ── Overnight pause window (Central Time) ───────────────
  // Auctions freeze between 12:00am – 8:00am Central every day.
  const PAUSE_START_HOUR = 0;   // midnight Central
  const PAUSE_END_HOUR   = 8;   // 8am Central

  function isNightPause(now = Date.now()) {
    const ct   = new Date(new Date(now).toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const hour = ct.getHours();
    return hour >= PAUSE_START_HOUR && hour < PAUSE_END_HOUR;
  }

  function msTillPauseEnd(now = Date.now()) {
    const ct     = new Date(new Date(now).toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const resume = new Date(ct);
    resume.setHours(PAUSE_END_HOUR, 0, 0, 0);
    if (resume <= ct) resume.setDate(resume.getDate() + 1);
    return resume - ct;
  }

  function effectiveTimeLeft(auction, now = Date.now()) {
    if (!auction || auction.cancelled) return { left: 0, paused: false };
    const paused = isNightPause(now);
    const raw    = auction.expiresAt - now;
    return { left: Math.max(0, raw), paused };
  }

  // When a bid (or nomination) sets the expiry, skip over any current pause window
  function nextExpiry(now = Date.now()) {
    if (isNightPause(now)) {
      return now + msTillPauseEnd(now) + DURATION_MS;
    }
    return now + DURATION_MS;
  }

  // ── Firebase paths ──────────────────────────────────────
  function auctionsRef(leagueId)      { return db.ref(`leagues/${leagueId}/auctions`); }
  function auctionRef(leagueId, id)   { return db.ref(`leagues/${leagueId}/auctions/${id}`); }
  function faabOverridesRef(leagueId)  { return db.ref(`leagues/${leagueId}/faabOverrides`); }
  function rosterSizesRef(leagueId)    { return db.ref(`leagues/${leagueId}/rosterSizes`); }

  // ── Subscribe to live auction updates ───────────────────
  function subscribe(leagueId, callback) {
    auctionsRef(leagueId).on('value', snap => {
      const data = snap.val() || {};
      callback(Object.values(data));
    });
  }

  function unsubscribe(leagueId) { auctionsRef(leagueId).off(); }

  function subscribeFaabOverrides(leagueId, callback) {
    faabOverridesRef(leagueId).on('value', snap => callback(snap.val() || {}));
  }

  function subscribeRosterSizes(leagueId, callback) {
    rosterSizesRef(leagueId).on('value', snap => callback(snap.val() || {}));
  }

  async function setRosterSize(leagueId, rosterId, size) {
    await rosterSizesRef(leagueId).update({ [rosterId]: size });
  }

  // ── Create a new auction (nomination) ───────────────────
  async function nominate(leagueId, playerId, rosterId, maxBid) {
    const id  = 'auc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const now = Date.now();
    const auction = {
      id, playerId,
      nominatedBy: rosterId,
      startTime:   now,
      expiresAt:   nextExpiry(now),
      bids:        [{ rosterId, maxBid, timestamp: now }],
      processed:   false,
      cancelled:   false,
    };
    await auctionRef(leagueId, id).set(auction);
    return auction;
  }

  // ── Place / update a bid ─────────────────────────────────
  async function placeBid(leagueId, auctionId, rosterId, maxBid) {
    const ref    = auctionRef(leagueId, auctionId);
    const result = await ref.transaction(current => {
      if (!current || current.cancelled) return;
      const bids = current.bids ? Object.values(current.bids) : [];
      bids.push({ rosterId, maxBid, timestamp: Date.now() });
      current.bids      = bids;
      current.expiresAt = nextExpiry(Date.now());
      return current;
    });
    if (!result.committed) throw new Error('Bid failed — please try again.');
    return result.snapshot.val();
  }

  // ── Cancel an auction (commissioner only) ────────────────
  async function cancelAuction(leagueId, auctionId) {
    await auctionRef(leagueId, auctionId).update({ cancelled: true });
  }

  // ── Delete an auction entirely (commissioner only) ───────
  async function deleteAuction(leagueId, auctionId) {
    await auctionRef(leagueId, auctionId).remove();
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
  // displayBid = the current PRICE (what winner pays if auction ended now)
  // This is blind/proxy: solo bidder pays their opening floor, not their secret max.
  // When a second bidder enters, price rises to second.maxBid + 1 (capped at winner.maxBid).
  function computeLeadingBid(auction) {
    const bids = Array.isArray(auction.bids)
      ? auction.bids : Object.values(auction.bids || {});
    if (!bids.length) return { rosterId: null, displayBid: 1 };

    // Get highest max per roster
    const maxByRoster = {};
    bids.forEach(b => {
      if (!maxByRoster[b.rosterId] || b.maxBid > maxByRoster[b.rosterId])
        maxByRoster[b.rosterId] = b.maxBid;
    });

    const entries = Object.entries(maxByRoster)
      .map(([id, max]) => ({ rosterId: parseInt(id), maxBid: max }))
      .sort((a, b) => b.maxBid - a.maxBid);

    if (entries.length === 1) {
      // Solo bidder: price is the first bid ever placed (the nomination floor)
      // This is the lowest bid made by this roster — their opening bid
      const firstBid = [...bids]
        .filter(b => b.rosterId === entries[0].rosterId)
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      return { rosterId: entries[0].rosterId, displayBid: firstBid?.maxBid ?? 1 };
    }

    const winner = entries[0], second = entries[1];
    return { rosterId: winner.rosterId, displayBid: Math.min(winner.maxBid, second.maxBid + 1) };
  }

  function getMyMaxBid(auction, rosterId) {
    const bids = Array.isArray(auction.bids)
      ? auction.bids : Object.values(auction.bids || {});
    const mine = bids.filter(b => b.rosterId === rosterId);
    return mine.length ? Math.max(...mine.map(b => b.maxBid)) : 0;
  }

  function getCommittedFaab(auctions, rosterId) {
    const now = Date.now();
    return auctions
      .filter(a => !a.processed && !a.cancelled && a.expiresAt > now)
      .reduce((sum, a) => sum + getMyMaxBid(a, rosterId), 0);
  }

  return {
    DURATION_MS, isNightPause, msTillPauseEnd, effectiveTimeLeft,
    subscribe, unsubscribe, subscribeFaabOverrides,
    nominate, placeBid, cancelAuction, deleteAuction, markProcessed,
    setFaabOverride, clearFaabOverride, resetAll,
    subscribeRosterSizes, setRosterSize,
    computeLeadingBid, getMyMaxBid, getCommittedFaab,
  };
})();
