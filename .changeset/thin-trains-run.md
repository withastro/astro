---
'astro': patch
---

HMR - Improved error recovery

This improves error recovery for HMR. Now when the dev server finds itself in an error state (because a route contained an error), it will recover from that state and refresh the page when the user has corrected the mistake.