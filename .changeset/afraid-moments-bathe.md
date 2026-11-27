---
'@astrojs/react-renderer': patch
---

Fixes a bug where submitting a `useActionState()` form without JavaScript showed the result in every island of the same component on the page, not only in the island whose form was submitted
