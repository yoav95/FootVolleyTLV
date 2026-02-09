/**
 * Rate limiter + cache layer to prevent Firebase request overflow.
 * 
 * - Throttles repeated calls to the same action
 * - Caches read results with configurable TTL
 * - Deduplicates in-flight requests
 */

// --- Rate Limiter ---

const actionTimestamps = new Map(); // key -> [timestamps]

const RATE_LIMITS = {
  // Max calls allowed within the time window (ms)
  'getAllGames':            { max: 3,  windowMs: 10_000 },
  'getGameById':            { max: 10, windowMs: 10_000 },
  'getUserProfile':         { max: 20, windowMs: 10_000 },
  'getOrganizerPendingReqs':{ max: 3,  windowMs: 30_000 },
  'createGame':             { max: 2,  windowMs: 60_000 },
  'deleteGame':             { max: 2,  windowMs: 60_000 },
  'requestToJoin':          { max: 3,  windowMs: 30_000 },
  'approveRequest':         { max: 5,  windowMs: 10_000 },
  'rejectRequest':          { max: 5,  windowMs: 10_000 },
  'leaveGame':              { max: 3,  windowMs: 30_000 },
  'addComment':             { max: 5,  windowMs: 30_000 },
  'deleteComment':          { max: 5,  windowMs: 30_000 },
  'updateProfile':          { max: 3,  windowMs: 30_000 },
  'signIn':                 { max: 3,  windowMs: 60_000 },
  'default':                { max: 10, windowMs: 10_000 },
};

/**
 * Check if an action is rate-limited. Throws if limit exceeded.
 * @param {string} action - Action name matching RATE_LIMITS key
 * @param {boolean} softFail - If true, returns false instead of throwing (use for reads)
 * @returns {boolean} true if allowed, false if soft-limited
 */
export function checkRateLimit(action, softFail = false) {
  const limit = RATE_LIMITS[action] || RATE_LIMITS.default;
  const now = Date.now();
  const key = action;

  if (!actionTimestamps.has(key)) {
    actionTimestamps.set(key, []);
  }

  const timestamps = actionTimestamps.get(key);

  // Remove expired timestamps
  const valid = timestamps.filter(t => now - t < limit.windowMs);
  actionTimestamps.set(key, valid);

  if (valid.length >= limit.max) {
    if (softFail) return false;
    throw new Error('יותר מדי בקשות. אנא המתן מספר שניות ונסה שוב.');
  }

  valid.push(now);
  return true;
}


// --- In-Memory Cache ---

const cache = new Map(); // cacheKey -> { data, expiresAt }
const inflightRequests = new Map(); // cacheKey -> Promise

const CACHE_TTL = {
  'userProfile':   60_000,   // 1 minute
  'allGames':      15_000,   // 15 seconds
  'gameById':      10_000,   // 10 seconds
  'pendingReqs':   20_000,   // 20 seconds
  'default':       10_000,
};

/**
 * Get cached data if still valid.
 * @param {string} key
 * @returns {any|null}
 */
export function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

/**
 * Store data in cache with TTL.
 * @param {string} key
 * @param {any} data
 * @param {string} type - Cache type for TTL lookup
 */
export function setCache(key, data, type = 'default') {
  const ttl = CACHE_TTL[type] || CACHE_TTL.default;
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Invalidate a specific cache entry or all entries matching a prefix.
 * @param {string} keyOrPrefix
 */
export function invalidateCache(keyOrPrefix) {
  for (const key of cache.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix + ':')) {
      cache.delete(key);
    }
  }
}

/**
 * Deduplicate in-flight requests. If the same request is already pending,
 * return the existing promise instead of firing a new one.
 * @param {string} key
 * @param {Function} fetchFn - Async function to execute
 * @returns {Promise<any>}
 */
export async function deduplicatedFetch(key, fetchFn) {
  // Check cache first
  const cached = getCached(key);
  if (cached !== null) return cached;

  // Check if there's already an in-flight request
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  // Execute and track
  const promise = fetchFn()
    .then(result => {
      inflightRequests.delete(key);
      return result;
    })
    .catch(err => {
      inflightRequests.delete(key);
      throw err;
    });

  inflightRequests.set(key, promise);
  return promise;
}

/**
 * Clear all caches and timestamps (useful on logout).
 */
export function clearAll() {
  cache.clear();
  actionTimestamps.clear();
  inflightRequests.clear();
}
