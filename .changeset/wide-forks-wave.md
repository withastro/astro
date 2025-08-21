---
'@astrojs/vercel': patch
---

Fix Vercel Image Optimization dropping leading slash in URL param for ESM imported images. Resolves issue where ESM imported images generated malformed URLs missing the leading slash, while string paths worked correctly.
