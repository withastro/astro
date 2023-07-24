---
'astro': patch
---

Execute scripts when navigating to a new page

When navigating to an new page with client-side navigation, scripts are executed (and re-executed). This makes it so that any new scripts on the incoming page are run and DOM can be updated.

Module scripts won't re-execute because they never do. To support cases where you want to modify the DOM this also adds a `astro:load` event that you can listen to:

```js
document.addEventListener('astro:load', () => {
  updateTheDOMSomehow();
});
```
