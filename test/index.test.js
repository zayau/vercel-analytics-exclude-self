import test from "node:test";
import assert from "node:assert/strict";

import {
  applySelfVisitPreferenceFromUrl,
  createBeforeSend,
  disableSelfVisitExclusion,
  enableSelfVisitExclusion,
  shouldExcludeSelfVisits,
} from "../src/index.js";

test("excludes visits when the saved preference is true", () => {
  const storage = {
    getItem(key) {
      return key === "exclude-self-visits" ? "true" : null;
    },
  };

  assert.equal(shouldExcludeSelfVisits(storage), true);
});

test("allows visits when the preference is missing", () => {
  const storage = {
    getItem() {
      return null;
    },
  };

  assert.equal(shouldExcludeSelfVisits(storage), false);
});

test("allows visits when the saved preference is false", () => {
  const storage = {
    getItem() {
      return "false";
    },
  };

  assert.equal(shouldExcludeSelfVisits(storage), false);
});

test("allows visits when storage access throws an error", () => {
  const storage = {
    getItem() {
      throw new Error("Storage access denied");
    },
  };

  assert.equal(shouldExcludeSelfVisits(storage), false);
});

test("enables exclusion successfully", () => {
  const values = new Map();

  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };

  assert.equal(shouldExcludeSelfVisits(storage), false);
  assert.equal(enableSelfVisitExclusion(storage), true);
  assert.equal(shouldExcludeSelfVisits(storage), true);
});

test("reports failure when the preference cannot be saved", () => {
  const storage = {
    setItem() {
      throw new Error("Storage access denied");
    },
  };

  assert.equal(enableSelfVisitExclusion(storage), false);
});

test("disables an existing exclusion successfully", () => {
  const values = new Map([["exclude-self-visits", "true"]]);

  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
  };

  assert.equal(shouldExcludeSelfVisits(storage), true);
  assert.equal(disableSelfVisitExclusion(storage), true);
  assert.equal(shouldExcludeSelfVisits(storage), false);
});

test("reports failure when the preference cannot be removed", () => {
  const storage = {
    removeItem() {
      throw new Error("Storage access denied");
    },
  };

  assert.equal(disableSelfVisitExclusion(storage), false);
});

test("blocks analytics events when exclusion is enabled", () => {
  const storage = {
    getItem() {
      return "true";
    },
  };

  const beforeSend = createBeforeSend(storage);
  const event = { type: "pageview", url: "https://example.com/" };

  assert.equal(beforeSend(event), null);
});

test("passes through the original event when exclusion is disabled", () => {
  const storage = {
    getItem() {
      return null;
    },
  };

  const beforeSend = createBeforeSend(storage);
  const event = { type: "pageview", url: "https://example.com/" };

  assert.equal(beforeSend(event), event);
});

test("reads the current preference for every event", () => {
  let preference = null;

  const storage = {
    getItem() {
      return preference;
    },
  };

  const beforeSend = createBeforeSend(storage);
  const event = { type: "pageview", url: "https://example.com/" };

  assert.equal(beforeSend(event), event);

  preference = "true";
  assert.equal(beforeSend(event), null);

  preference = null;
  assert.equal(beforeSend(event), event);
});

test("enables exclusion from the URL and preserves other URL details", () => {
  const values = new Map();

  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };

  const location = {
    href: "https://example.com/?theme=light&exclude-self-visits=true#intro",
  };

  let replacement = null;

  const history = {
    state: { source: "test" },
    replaceState(state, unused, url) {
      replacement = { state, url: String(url) };
    },
  };

  const applied = applySelfVisitPreferenceFromUrl({
    storage,
    location,
    history,
  });

  assert.equal(applied, true);
  assert.equal(shouldExcludeSelfVisits(storage), true);
  assert.equal(replacement.url, "https://example.com/?theme=light#intro");
  assert.equal(replacement.state, history.state);

  const beforeSend = createBeforeSend(storage);
  const event = { type: "pageview", url: replacement.url };

  assert.equal(beforeSend(event), null);
});

test("disables exclusion from the URL", () => {
  const values = new Map([["exclude-self-visits", "true"]]);

  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
  };

  let cleanedUrl = null;

  const history = {
    state: null,
    replaceState(state, unused, url) {
      cleanedUrl = String(url);
    },
  };

  const applied = applySelfVisitPreferenceFromUrl({
    storage,
    location: {
      href: "https://example.com/?exclude-self-visits=false",
    },
    history,
  });

  assert.equal(applied, true);
  assert.equal(values.has("exclude-self-visits"), false);
  assert.equal(shouldExcludeSelfVisits(storage), false);
  assert.equal(cleanedUrl, "https://example.com/");
});

test("ignores missing or invalid URL preferences", () => {
  for (const query of ["", "?exclude-self-visits=maybe"]) {
    let storageChanges = 0;
    let historyChanges = 0;

    const storage = {
      getItem() {
        return "true";
      },
      setItem() {
        storageChanges++;
      },
      removeItem() {
        storageChanges++;
      },
    };

    const history = {
      state: null,
      replaceState() {
        historyChanges++;
      },
    };

    const applied = applySelfVisitPreferenceFromUrl({
      storage,
      location: { href: `https://example.com/${query}` },
      history,
    });

    assert.equal(applied, false);
    assert.equal(storageChanges, 0);
    assert.equal(historyChanges, 0);
    assert.equal(shouldExcludeSelfVisits(storage), true);
  }
});

test("preserves the URL when saving the preference fails", () => {
  const storage = {
    setItem() {
      throw new Error("Storage access denied");
    },
  };

  const history = {
    state: null,
    replaceState() {
      assert.fail("History must not change when saving fails");
    },
  };

  const applied = applySelfVisitPreferenceFromUrl({
    storage,
    location: {
      href: "https://example.com/?exclude-self-visits=true",
    },
    history,
  });

  assert.equal(applied, false);
});
