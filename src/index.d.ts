export declare function shouldExcludeSelfVisits(
  storage?: Pick<Storage, "getItem"> | null,
): boolean;

export declare function enableSelfVisitExclusion(
  storage?: Pick<Storage, "setItem"> | null,
): boolean;

export declare function disableSelfVisitExclusion(
  storage?: Pick<Storage, "removeItem"> | null,
): boolean;

export type BeforeSend = <TEvent>(event: TEvent) => TEvent | null;

export declare function createBeforeSend(
  storage?: Pick<Storage, "getItem"> | null,
): BeforeSend;

export interface UrlPreferenceOptions {
  storage?: Pick<Storage, "setItem" | "removeItem"> | null;
  location?: Pick<Location, "href"> | null;
  history?: Pick<History, "state" | "replaceState"> | null;
}

export declare function applySelfVisitPreferenceFromUrl(
  options?: UrlPreferenceOptions,
): boolean;
