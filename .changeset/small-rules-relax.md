---
'astro': minor
---

Route Announcer in `<ViewTransitions />`

The View Transitions router now does route announcement. When transitioning between pages with a traditional MPA approach, assistive technologies will announce the page title when the page finishes loading. This does not automatically happen during client-side routing, so visitors relying on these technologies to announce routes are not aware when a page has changed.

The view transitions route announcer runs after the `astro:page-load` event, looking for the page `<title>` to announce. If one cannot be found, the announcer falls back to the first `<h1>` it finds, or otherwise announces the pathname. We recommend you always include a `<title>` in each page for accessibility.

See the [View Transitions docs](https://docs.astro.build/en/guides/view-transitions/) for more on how accessibility is handled.
