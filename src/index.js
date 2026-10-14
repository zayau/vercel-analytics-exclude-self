const STORAGE_KEY = "exclude-self-visits";

export function shouldExcludeSelfVisits(storage) {
  try {
    const currentStorage = storage ?? globalThis.localStorage;

    return currentStorage?.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function enableSelfVisitExclusion(storage) {
  try {
    const currentStorage = storage ?? globalThis.localStorage;

    currentStorage.setItem(STORAGE_KEY, "true");

    return true;
  } catch {
    return false;
  }
}

export function disableSelfVisitExclusion(storage) {
  try {
    const currentStorage = storage ?? globalThis.localStorage;

    currentStorage.removeItem(STORAGE_KEY);

    return true;
  } catch {
    return false;
  }
}

export function createBeforeSend(storage) {
  return function beforeSend(event) {
    if (shouldExcludeSelfVisits(storage)) {
      return null;
    }

    return event;
  };
}

export function applySelfVisitPreferenceFromUrl({
  storage,
  location = globalThis.location,
  history = globalThis.history,
} = {}) {
  if (!location || !history) {
    return false;
  }

  const url = new URL(location.href);
  const preference = url.searchParams.get(STORAGE_KEY);

  if (preference !== "true" && preference !== "false") {
    return false;
  }

  const saved =
    preference === "true"
      ? enableSelfVisitExclusion(storage)
      : disableSelfVisitExclusion(storage);

  if (!saved) {
    return false;
  }

  url.searchParams.delete(STORAGE_KEY);
  history.replaceState(history.state, "", url);

  return true;
}
