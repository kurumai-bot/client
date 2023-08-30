// This suspends a component while a promise is pending.
// The promise has to be the same inbetween calls, essentially meaning the promise has to be
// This is required for `Suspense` to work.
const cache = new Array<SuspendEntry<any>>;
export interface SuspendEntry<T> {
  status?: "fulfilled" | "pending" | "rejected"
  result?: T
  promise: Promise<T>
  keys: Array<unknown>
  deletionTime: Date
  ttlSeconds: number
}

export default function suspend<T>(
  promiseFunc: () => Promise<T>,
  keys: Array<unknown>,
  ttlSeconds?: number
) {
  // Validate cache and find if the given deps are already in the cache
  const now = Date.now();
  let idx = -1;
  for (let i = 0; i < cache.length; i++) {
    if (cache[i].deletionTime < new Date(now)) {
      cache.splice(i, 1);
      i--;
    } else if (cache[i].keys.length === keys.length
      && cache[i].keys.every((dep, k) => dep === keys[k])
    ) {
      idx = i;
    }
  }

  let entry: SuspendEntry<T>;
  if (idx === -1) {
    // If it's not in the cache then create a new promise
    ttlSeconds = ttlSeconds === undefined ? 900 : ttlSeconds;
    entry = {
      promise: promiseFunc(),
      keys: keys,
      deletionTime: new Date(now + ttlSeconds * 1000),
      ttlSeconds: ttlSeconds
    };
    cache.push(entry);
  } else {
    // If it is then update deletion time
    entry = cache[idx];
    ttlSeconds = ttlSeconds === undefined ? entry.ttlSeconds : ttlSeconds;
    entry.deletionTime = new Date(now + ttlSeconds * 1000);
  }

  // Check status of promise
  switch (entry.status) {
    case "fulfilled":
      return entry.result!;
    case "pending":
      throw entry.result;
    case "rejected":
      throw entry.result;
    default:
      entry.status = "pending";

      // The removal of keys from the cache is not done in a `finally` in case the promise
      // resolves before `suspend` can be called again.
      entry.promise.then((val) => {
        entry.status = "fulfilled";
        entry.result = val;
      }).catch((err) => {
        entry.status = "rejected";
        entry.result = err;
      });
      throw entry.promise;
  }
}