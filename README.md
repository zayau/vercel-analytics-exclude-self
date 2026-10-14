# vercel-analytics-exclude-self

Exclude your own visits from Vercel Web Analytics using a browser preference.

This dependency-free helper stores `exclude-self-visits=true` in localStorage and checks it through Vercel’s [`beforeSend` hook](https://vercel.com/docs/analytics/package#beforesend). When exclusion is enabled, the hook returns `null` to skip pageviews and custom events.

## Install from GitHub

```sh
npm install github:zayau/vercel-analytics-exclude-self
```

Your application must already have Vercel Web Analytics configured. This helper provides the exclusion logic; it does not load analytics automatically.

## React

Apply the URL preference in your browser entry file before rendering the analytics component. For example, in a Vite application’s `main.jsx`:

```jsx
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";

import {
  applySelfVisitPreferenceFromUrl,
  createBeforeSend,
} from "vercel-analytics-exclude-self";

import App from "./App.jsx";

applySelfVisitPreferenceFromUrl();

createRoot(document.getElementById("root")).render(
  <>
    <App />
    <Analytics beforeSend={createBeforeSend()} />
  </>,
);
```

If you already use `beforeSend`, combine your existing logic with this filter rather than replacing it.

## Plain HTML

The runnable example is in `examples/vanilla/index.html`.

It imports the helper directly from the source, applies the URL preference, registers the filter through `window.va`, and then loads Vercel’s development script.

From the repository root:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Open <http://127.0.0.1:4174/examples/vanilla/> and check the browser console while enabling and disabling exclusion.

For a production site on Vercel, load `/_vercel/insights/script.js` after registering the filter. The development script is for local testing.

## Enable or disable exclusion

Once the URL helper is integrated, visit your site with:

```text
https://your-site.example/?exclude-self-visits=true
```

To allow visits again:

```text
https://your-site.example/?exclude-self-visits=false
```

After successfully saving the preference, the helper removes that parameter without reloading the page. Other query parameters, the hash, and existing history state are preserved.

Missing or invalid values leave the existing preference unchanged. If saving fails, the URL remains unchanged.

You can also change the preference directly:

```js
import {
  enableSelfVisitExclusion,
  disableSelfVisitExclusion,
} from "vercel-analytics-exclude-self";

enableSelfVisitExclusion();
disableSelfVisitExclusion();
```

The filter checks the saved preference for every event, so changes take effect without recreating the callback.

## API

| Function                            | Result                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `shouldExcludeSelfVisits()`         | Whether the saved preference is `"true"`.                                      |
| `enableSelfVisitExclusion()`        | Whether saving the preference succeeded.                                       |
| `disableSelfVisitExclusion()`       | Whether removing the preference succeeded.                                     |
| `createBeforeSend()`                | A callback that returns `null` when excluded, or the original event otherwise. |
| `applySelfVisitPreferenceFromUrl()` | Whether a valid URL preference was successfully saved and the URL cleaned.     |

The storage functions and callback factory accept an optional storage object for testing. The URL helper accepts an optional object containing `storage`, `location`, and `history`.

Importing the module does not access browser storage or start analytics.

## Storage limitations

The preference applies to one browser profile and one origin: the same protocol, hostname, and port. Enable it separately in each browser or device you use, including mobile browsers. Local development and your live site have separate preferences.

localStorage normally survives browser restarts. Clearing site data removes the preference, and private browsing storage is temporary. See [MDN’s localStorage documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

### Safari

With Intelligent Tracking Prevention enabled, Safari can delete script-writable storage, including localStorage, after seven days of Safari use without interaction with the site. This is not simply seven calendar days.

Clicks, taps, and keyboard input count as interaction; scrolling alone does not. If Safari removes the preference, enable exclusion again.

See [WebKit’s storage policy announcement](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/) and [tracking prevention documentation](https://webkit.org/tracking-prevention/).

If storage cannot be read, this helper allows analytics events through. If storage cannot be written or cleared, the corresponding operation returns `false`.

## Tests

```sh
npm test
```

Tests use Node’s built-in test runner and cover preference changes, event filtering, URL cleanup, and storage failures.

## License

[MIT](LICENSE)
