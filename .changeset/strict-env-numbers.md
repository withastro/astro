---
'astro': patch
---

Fixes `envField.number()` accepting values that only start with a number. A value such as `8080abc`, `10px`, or `1,5` was read as `8080`, `10`, or `1` and passed validation; it is now reported as an invalid number.
