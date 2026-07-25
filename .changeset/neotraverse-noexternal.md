---
'astro': patch
---

Fixes a build failure (`does not provide an export named 'forEach'`) when another dependency in the project pulls in an older `neotraverse@^0.6.x`. `neotraverse` is now always bundled so the prerender output resolves Astro's own copy instead of a hoisted incompatible one.
