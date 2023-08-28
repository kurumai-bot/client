// This suspends a component while a promise is pending.
// The promise has to be the same inbetween calls, essentially meaning the promise has to be
// This is required for `Suspense` to work.
const suspendKeys = new Array<Array<unknown>>;
const suspendPromises = new Array<SuspendPromise<any>>;
export type SuspendPromise<T> = {
  _status: "fulfilled" | "pending" | "rejected", _res: T
} & Promise<T>

export default function suspend<T>(promiseFunc: () => Promise<T>, keys: Array<unknown>) {
  // Check if deps match any in cache
  let promise: SuspendPromise<T>;
  const idx = suspendKeys.findIndex(
    (otherKeys) => otherKeys.every((otherKey, index) => otherKey === keys[index])
  );

  if (idx === -1) {
    // If they don't create the promise
    promise = promiseFunc() as SuspendPromise<T>;
    suspendKeys.push(keys);
    suspendPromises.push(promise);
  } else {
    promise = suspendPromises[idx];
  }

  // Check status of promise
  switch (promise._status) {
    case "fulfilled":
      suspendKeys.splice(idx, 1);
      suspendPromises.splice(idx, 1);
      return promise._res;
    case "pending":
      throw promise;
    case "rejected":
      suspendKeys.splice(idx, 1);
      suspendPromises.splice(idx, 1);
      throw promise._res;
    default:
      promise._status = "pending";

      // The removal of keys from the cache is not done in a `finally` in case the promise
      // resolves before `suspend` can be called again.
      promise.then((val) => {
        promise!._status = "fulfilled";
        promise!._res = val;
      }).catch((err) => {
        promise!._status = "rejected";
        promise!._res = err;
      });
      throw promise;
  }
}