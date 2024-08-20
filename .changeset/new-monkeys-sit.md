---
'astro': minor
---

Adds a new object `swapFunctions` to expose the necessary utility functions on `astro:transitions/client` that allow you to build custom swap functions as view transitions.

The example below uses these functions to recreate Astro's own default `swap` transition as a defined custom swap:

```astro
<script>
import { swapFunctions } from 'astro:transitions/client';
// substitutes window.document with doc
function myAstroSwap(doc: Document) {
  swapFunctions.deselectScripts(doc);
  swapFunctions.swapRootAttributes(doc);
  swapFunctions.swapHeadElements(doc);
  const restoreFocusFunction = swapFunctions.saveFocus();
  swapFunctions.swapBodyElement(doc.body, document.body);
  restoreFocusFunction();
};

  event.swap = () => myAstroSwap(event.newDocument);

<script>
```
