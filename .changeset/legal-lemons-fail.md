---
'astro': patch
---

Fixes `astro add cloudflare` failing to install dependencies with pnpm v11+ by approving the `workerd` build script, and shows the package manager's error output when `astro add` fails to install dependencies
