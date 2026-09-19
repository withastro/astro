---
'astro': patch
---

Fix three error names that did not match their documented reference. `MissingLocale`, `MissingIndexForInternationalization` and `NoManifestAvailable` reported names ending in `Error` in the dev overlay, while their error reference pages are published under the unsuffixed names, so the name shown to users could not be found in the docs.
