---
'astro': patch
---

Execute scripts when navigating to a new page.

When navigating to an new page with client-side navigation, scripts are executed (and re-executed) so that any new scripts on the incoming page are run and the DOM can be updated.

However, `type=module` scripts never re-execute in Astro, and will not do so in client-side routing. To support cases where you want to modify the DOM, a new `astro:load` event listener been added:

```js
document.addEventListener('astro:load', () => {
  updateTheDOMSomehow();
});
```
