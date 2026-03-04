---
'astro': patch
---

Fixes WebGL context loss on `transition:persist` canvas elements during Safari page navigation.

`swapBodyElement()` previously called `replaceWith()` which detached the old body from the DOM before moving persist elements to the new body. Safari loses WebGL2 context when canvas elements are briefly detached from the DOM tree.

The fix lifts persist elements with matching targets to `<html>` before the body swap, so they remain in the DOM throughout the transition. Uses `moveBefore()` where available (Chrome 133+) for zero-detachment atomic moves. Elements without a matching `transition:persist` target in the new page are correctly dropped (not re-inserted).
