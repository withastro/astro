---
'@astrojs/runtime': patch
---

Fixes a `moveBefore` `TypeError` and an empty island after client-side navigation when a `transition:persist` framework component renders the persist attribute on its own root element
