import {
  applySelfVisitPreferenceFromUrl,
  createBeforeSend,
  disableSelfVisitExclusion,
  enableSelfVisitExclusion,
  shouldExcludeSelfVisits,
} from "vercel-analytics-exclude-self";

const excluded: boolean = shouldExcludeSelfVisits();
const enabled: boolean = enableSelfVisitExclusion();
const disabled: boolean = disableSelfVisitExclusion();

const applied: boolean = applySelfVisitPreferenceFromUrl({
  storage: localStorage,
  location: { href: "https://example.com/" },
  history,
});

const beforeSend = createBeforeSend();

const event = {
  type: "pageview",
  url: "https://example.com/",
  extra: 42,
};

const result = beforeSend(event);

if (result !== null) {
  const extra: number = result.extra;

  // @ts-expect-error The preserved field is a number.
  const wrong: string = result.extra;
}

// @ts-expect-error Storage must provide getItem.
shouldExcludeSelfVisits({});

// @ts-expect-error getItem must return a string or null.
createBeforeSend({ getItem: () => true });

// @ts-expect-error href must be a string.
applySelfVisitPreferenceFromUrl({ location: { href: 123 } });
