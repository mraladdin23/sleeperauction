// ─────────────────────────────────────────────────────────────
//  AUCTION ENGINE  (Firebase-backed, real-time)
// ─────────────────────────────────────────────────────────────

const Auction = (() => {

  const DURATION_MS    = 8 * 60 * 60 * 1000; // 8 active hours
  const MIN_BID        = 100_000;             // $100K minimum bid

  // ── Overnight pause window (Central Time) ───────────────
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

  function nextExpiry(now = Date.now()) {
    if (isNightPause(now)) {
      return now + msTillPauseEnd(now) + DURATION_MS;
    }
    return now + DURATION_MS;
  }

  // ── Firebase paths ──────────────────────────────────────
  function auctionsRef(leagueId)       { return db.ref(`leagues/${leagueId}/auctions`); }
  function auctionRef(leagueId, id)    { return db.ref(`leagues/${leagueId}/auctions/${id}`); }
  function faabOverridesRef(leagueId)  { return db.ref(`leagues/${leagueId}/faabOverrides`); }
  function rosterSizesRef(leagueId)    { return db.ref(`leagues/${leagueId}/rosterSizes`); }
  function activityFeedRef(leagueId)   { return db.ref(`leagues/${leagueId}/activityFeed`); }
  function watchlistRef(leagueId, uid) { return db.ref(`leagues/${leagueId}/watchlists/${uid}`); }

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

  function subscribeActivityFeed(leagueId, callback) {
    activityFeedRef(leagueId).orderByChild('timestamp').limitToLast(100)
      .on('value', snap => {
        const items = [];
        snap.forEach(child => items.push(child.val()));
        callback(items.reverse()); // newest first
      });
  }

  function subscribeWatchlist(leagueId, uid, callback) {
    watchlistRef(leagueId, uid).on('value', snap => callback(snap.val() || {}));
  }

  async function setRosterSize(leagueId, rosterId, size) {
    await rosterSizesRef(leagueId).update({ [rosterId]: size });
  }

  // ── Watchlist ────────────────────────────────────────────
  async function addWatch(leagueId, uid, playerId) {
    await watchlistRef(leagueId, uid).update({ [playerId]: true });
  }
  async function removeWatch(leagueId, uid, playerId) {
    await watchlistRef(leagueId, uid).child(playerId).remove();
  }

  // ── Activity feed ────────────────────────────────────────
  async function logActivity(leagueId, event) {
    const id  = 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2,4);
    await activityFeedRef(leagueId).child(id).set({
      id, timestamp: Date.now(), ...event
    });
  }

  // ── Create a new auction (nomination) ───────────────────
  async function nominate(leagueId, playerId, rosterId, maxBid, teamName, playerName) {
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
    await logActivity(leagueId, {
      type: 'nomination',
      auctionId: id,
      playerId,
      playerName: playerName || playerId,
      rosterId,
      teamName: teamName || `Team ${rosterId}`,
      amount: maxBid,
    });
    return auction;
  }

  // ── Place / update a bid ─────────────────────────────────
  async function placeBid(leagueId, auctionId, rosterId, maxBid, teamName, playerName, playerId) {
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
    await logActivity(leagueId, {
      type: 'bid',
      auctionId,
      playerId: playerId || '',
      playerName: playerName || '',
      rosterId,
      teamName: teamName || `Team ${rosterId}`,
      amount: maxBid,
    });
    return result.snapshot.val();
  }

  // ── Cancel an auction (commissioner only) ────────────────
  async function cancelAuction(leagueId, auctionId, playerName, commName) {
    await auctionRef(leagueId, auctionId).update({ cancelled: true });
    await logActivity(leagueId, {
      type: 'cancel',
      auctionId,
      playerName: playerName || '',
      teamName: commName || 'Commissioner',
    });
  }

  // ── Delete an auction entirely (commissioner only) ───────
  async function deleteAuction(leagueId, auctionId) {
    await auctionRef(leagueId, auctionId).remove();
  }

  // ── Claim / process (commissioner) ───────────────────────
  async function claimAuction(leagueId, auctionId, winnerRosterId, winnerTeamName, amount, playerName, playerId) {
    await auctionRef(leagueId, auctionId).update({ processed: true, claimedAt: Date.now() });
    await logActivity(leagueId, {
      type: 'claim',
      auctionId,
      playerId: playerId || '',
      playerName: playerName || '',
      rosterId: winnerRosterId,
      teamName: winnerTeamName || `Team ${winnerRosterId}`,
      amount,
    });
  }

  // ── Mark auction as processed (legacy alias) ─────────────
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
  function computeLeadingBid(auction) {
    const bids = Array.isArray(auction.bids)
      ? auction.bids : Object.values(auction.bids || {});
    if (!bids.length) return { rosterId: null, displayBid: MIN_BID };

    const maxByRoster = {};
    bids.forEach(b => {
      if (!maxByRoster[b.rosterId] || b.maxBid > maxByRoster[b.rosterId])
        maxByRoster[b.rosterId] = b.maxBid;
    });

    const entries = Object.entries(maxByRoster)
      .map(([id, max]) => ({ rosterId: parseInt(id), maxBid: max }))
      .sort((a, b) => b.maxBid - a.maxBid);

    if (entries.length === 1) {
      const firstBid = [...bids]
        .filter(b => b.rosterId === entries[0].rosterId)
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      return { rosterId: entries[0].rosterId, displayBid: firstBid?.maxBid ?? MIN_BID };
    }

    const winner = entries[0], second = entries[1];
    return {
      rosterId: winner.rosterId,
      displayBid: Math.min(winner.maxBid, second.maxBid + MIN_BID)
    };
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

  function passesRef(leagueId, auctionId) {
    return db.ref(`leagues/${leagueId}/auctions/${auctionId}/passes`);
  }

  // ── Pass on an auction ───────────────────────────────────
  // Records this roster's "not interested" vote.
  // If all non-nominating, non-bidding teams have passed → auto-close.
  async function passAuction(leagueId, auctionId, rosterId, allRosterIds, teamName, playerName) {
    // Record the pass
    await passesRef(leagueId, auctionId).update({ [rosterId]: Date.now() });

    await logActivity(leagueId, {
      type: 'pass',
      auctionId,
      playerName: playerName || '',
      rosterId,
      teamName: teamName || `Team ${rosterId}`,
    });

    // Check if all others have passed — if so, close immediately
    const snap    = await auctionRef(leagueId, auctionId).once('value');
    const auction = snap.val();
    if (!auction || auction.cancelled || auction.processed) return false;

    const passes    = Object.keys(auction.passes || {}).map(Number);
    const bids      = Array.isArray(auction.bids) ? auction.bids : Object.values(auction.bids || {});
    const bidders   = new Set(bids.map(b => b.rosterId));
    const nominator = auction.nominatedBy;

    // Everyone who must pass = all teams except nominator and anyone who has bid
    const mustPass = allRosterIds.filter(id => id !== nominator && !bidders.has(id));
    const allPassed = mustPass.every(id => passes.includes(id));

    if (allPassed) {
      // Auto-close: expire it now
      await auctionRef(leagueId, auctionId).update({ expiresAt: Date.now() - 1, autoClosedByPasses: true });
      await logActivity(leagueId, {
        type: 'autoclose',
        auctionId,
        playerName: playerName || '',
        teamName: 'System',
      });
      return true; // closed
    }
    return false;
  }

  return {
    DURATION_MS, MIN_BID,
    isNightPause, msTillPauseEnd, effectiveTimeLeft,
    subscribe, unsubscribe, subscribeFaabOverrides,
    subscribeRosterSizes, subscribeActivityFeed, subscribeWatchlist,
    nominate, placeBid, cancelAuction, deleteAuction, claimAuction, markProcessed,
    setFaabOverride, clearFaabOverride, resetAll,
    setRosterSize,
    addWatch, removeWatch,
    logActivity,
    passAuction,
    computeLeadingBid, getMyMaxBid, getCommittedFaab,
  };
})();
