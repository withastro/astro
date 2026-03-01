---
'@astrojs/cloudflare': patch
---

Fixes a dev server issue where framework components from linked packages would fail to load with a 504 error.

This could occur when using `client:only` or other client directives with components from monorepo packages (linked via `file:` or workspace protocol). The first request would trigger Vite's dependency optimizer mid-request, causing concurrent client module requests to fail.
