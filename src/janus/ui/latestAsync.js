/**
 * Race-safe async helper: only the latest run/schedule delivers a result.
 * Stale settlements resolve to `undefined` (errors from stale tasks are
 * swallowed). Pass an AbortSignal into `task` when true cancel is needed.
 */

export const createLatestAsync = ({
  debounceMs = 0,
} = {}) => {
  let generation = 0;
  let timer = null;
  let pendingTask = null;
  let pendingSettle = null;

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const settlePending = (value) => {
    if (!pendingSettle) {
      return;
    }
    const {
      resolve,
    } = pendingSettle;
    pendingSettle = null;
    resolve(value);
  };

  const cancel = () => {
    generation += 1;
    clearTimer();
    pendingTask = null;
    settlePending(undefined);
  };

  const run = (task) => {
    const id = generation += 1;
    clearTimer();
    pendingTask = null;
    return Promise.resolve().then(
      () => task(),
    ).then(
      (value) => {
        if (id !== generation) {
          return undefined;
        }
        return value;
      },
      (error) => {
        if (id !== generation) {
          return undefined;
        }
        throw error;
      },
    );
  };

  const schedule = (task) => {
    if (debounceMs <= 0) {
      return run(task);
    }
    settlePending(undefined);
    generation += 1;
    const scheduledGeneration = generation;
    pendingTask = task;
    clearTimer();
    return new Promise(
      (resolve, reject) => {
        pendingSettle = {
          resolve,
          reject,
        };
        timer = setTimeout(
          () => {
            timer = null;
            const settle = pendingSettle;
            pendingSettle = null;
            if (
              !settle ||
              scheduledGeneration !== generation
            ) {
              if (settle) {
                settle.resolve(undefined);
              }
              return;
            }
            const currentTask = pendingTask;
            pendingTask = null;
            run(currentTask).then(
              settle.resolve,
              settle.reject,
            );
          },
          debounceMs,
        );
      },
    );
  };

  return {
    run,
    schedule,
    cancel,
  };
};

export default createLatestAsync;
