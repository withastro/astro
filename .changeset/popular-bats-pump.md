---
'astro': patch
---

Changed where various parts of the build pipeline look to decide if a page should be prerendered. They now exclusively consider PageBuildData, allowing integrations to participate in the decision.
