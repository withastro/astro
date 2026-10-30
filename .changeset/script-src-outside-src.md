---
'astro': patch
---

Fixes bundling of a `<script src>` that uses a root-relative path to a project file outside `src/`, such as `/lib/analytics.ts`. The error asking for `is:inline` is now shown only when the path points to a file in `public/`.
