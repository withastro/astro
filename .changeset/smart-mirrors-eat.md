---
'astro': patch
---

Fixes a `<ClientRouter />` bug where the fallback view transition animations when exiting a page
ran too early for browsers that do not support the View Transition API.
This bug prevented `event.viewTransition?.skipTransition()` from skipping the page exit animation
when used in an `astro:before-swap` event hook.
