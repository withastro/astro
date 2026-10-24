---
'astro': patch
---

Fixes a `DEP0190` deprecation warning emitted by `astro info` on Node.js 24 and later. The npm, pnpm, and yarn package-manager queries were passing `shell: true` alongside an args array, which Node.js 24 flags as a potential security risk. Removing `shell: true` runs the commands directly with no behavioral change.
