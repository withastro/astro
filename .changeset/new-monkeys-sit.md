---
'astro': minor
---

Adds a new object `swapFunctions` to expose the necessary utility functions on `astro:transitions/client` that allow you to build custom swap functions to be used with view transitions.

The example below uses these functions to replace Astro's built-in default `swap` function with one that only swaps the `<main>` part of the page:

```html
<script>
import { swapFunctions } from 'astro:transitions/client';

document.addEventListener('astro:before-swap', (e) => { e.swap = () => swapMainOnly(e.newDocument) });

function swapMainOnly(doc: Document) {
  swapFunctions.deselectScripts(doc);
  swapFunctions.swapRootAttributes(doc);
  swapFunctions.swapHeadElements(doc);
  const restoreFocusFunction = swapFunctions.saveFocus();
  const newMain = doc.querySelector('main');
  const oldMain = document.querySelector('main');
  if (newMain && oldMain) {
    swapFunctions.swapBodyElement(newMain, oldMain);
  } else {
    swapFunctions.swapBodyElement(doc.body, document.body);
  }
  restoreFocusFunction();
};
</script>
```

See the [view transitions guide](https://docs.astro.build/en/guides/view-transitions/#astrobefore-swap) for more information about hooking into the `astro:before-swap` lifecycle event and adding a custom swap implementation.
