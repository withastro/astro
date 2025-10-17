---
'astro': patch
---

Fixes a bug where the dev server would crash when renaming TypeScript files. The server now properly handles file rename events and updates the module graph accordingly.

#### Additional Notes

This fix also improves error messages when file operations fail during development.
