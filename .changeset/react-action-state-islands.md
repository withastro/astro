---
'@astrojs/react-renderer': patch
---

Fixes a `useActionState()` result from a form submitted without JavaScript being shown in every island of the same React component, instead of only the island whose form was submitted
