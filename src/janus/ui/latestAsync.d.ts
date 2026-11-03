export type LatestAsyncTask<T> = () => T | PromiseLike<T>;

export type LatestAsync = {
  /** Run immediately; stale results fulfill as `undefined`. */
  run<T>(task: LatestAsyncTask<T>): Promise<T | undefined>;
  /** Debounced run (coalesces while waiting); same stale behavior as `run`. */
  schedule<T>(task: LatestAsyncTask<T>): Promise<T | undefined>;
  /** Invalidate in-flight work and clear the debounce timer. */
  cancel(): void;
};

export function createLatestAsync(options?: {
  debounceMs?: number;
}): LatestAsync;

export default createLatestAsync;
