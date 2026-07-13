---
'astro': patch
---

Fixes an issue where a client island could permanently fail to hydrate if the first attempt to load its component failed. Islands now reliably recover from transient import failures, which previously did not work for React components during `astro dev`.
