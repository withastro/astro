---
'astro': minor
---

Route Announcer in `<ViewTransitions />`

The View Transitions router now does route announcement. When transitioning between pages with a traditional MPA approach assistive technologies will announce the page title when the page finishes loading. When you introduce client-side routing into an app this no longer naturally happens, so the user isn't aware that the page has changed.

A route announcer runs after the page loads, for Astro this is the `astro:page-load` event, giving the title of the page to be the first thing announced. The ViewTransitions announcer first looks for the `<title>`, and if there is not one falls back to the first `<h1>` it finds, or otherwise announces the pathname. We recommend you always include a `<title>` in each page.

See the ViewTransitions docs for more on how accessibility is handled.
