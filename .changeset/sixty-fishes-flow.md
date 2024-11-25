---
'@astrojs/react': minor
'astro': minor
---

Changes the generated URL query param from `_astroAction` to `_action` when submitting a form using Actions. This avoids leaking the framework name into the URL bar, which may be considered a security issue.
