---
'astro': patch
---

Restores `Kebab` and `KebabKeys` type utilities that were incorrectly removed as dead code. These types are used by `astro-jsx.d.ts` to provide kebab-case CSS property autocomplete in `style={{ }}` objects. Their removal caused a TS2694 error for users who set `skipLibCheck: false`.
