---
'astro': minor
---

Include the final `allPages` object in the "astro:build:done" hook parameters. This allows integrations to access information such as `hoistedScript` and `contentCollectionCss` which is not currently exposed by the integration hook API during the build process.
