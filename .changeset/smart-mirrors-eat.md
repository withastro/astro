---
'astro': patch
---

Fixed a bug where fallback view transitions for page exit could not be skipped with `ClientRouter`.

In browsers that do not support the View Transition API, fallback animations are used by default.
Due to a bug, when navigating with `ClientRouter` in these browsers,
calling `event.skipTransition()` on the `astro:before-swap` event
would skip the _enter_ transition of the new page,
but not the _exit_ transition of the current page,
even though both should be skipped
(as they are in browsers that support the View Transition API).

The behaviour is now consistent across browsers, regardless of View Transition API support.
For example, the following code will skip both the exit transition of the current page
and the enter transition of the new page for self links:

```javascript
document.addEventListener('astro:before-swap', (e) => {
  if (e.from.href === e.to.href) e.viewTransition?.skipTransition();
});
```
