---
'astro': patch
---

Preserves the last-modified date of cached font files and unchanged public files when copying them into the build output. Public-file timestamp preservation respects the resolved public-directory configuration, follows source symlinks, and avoids backdating files overwritten by build plugins.
