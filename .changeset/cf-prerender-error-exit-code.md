---
'@astrojs/cloudflare': patch
---

Fixes a bug where an error thrown while prerendering a page in the workerd runtime did not fail the build. Pages stream by default, so an error thrown mid-render surfaced only after the `200` status line had already been sent, and the build wrote silently truncated HTML files and exited with code `0`. The prerender endpoint now buffers the rendered body inside workerd and reports render errors back to the build, which fails with the original error message and stack trace.
