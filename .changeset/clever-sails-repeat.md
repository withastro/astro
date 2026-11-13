---
'@astrojs/runtime': patch
---

Fixes hydration of framework components that receive sparse arrays as props. Holes in the array are now passed to the component as `undefined`.
