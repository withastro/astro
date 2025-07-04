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

Now, the following code will skip both the exit transition of the current page
and the enter transition of the new page, regardless of View Transition API support,
so that the behaviour is consistent across browsers:

```javascript
document.addEventListener('astro:before-swap', (e) => {
  e.viewTransition?.skipTransition();
});
```
