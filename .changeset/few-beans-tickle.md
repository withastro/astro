---
'@astrojs/markdown-remark': patch
---

Mark @astrojs/prism as an internal dependency


This package wasn't marked as an internal dependency correctly, which introduced a race condition in the build process.
Starting from now, @astrojs/prism will always be built first.
