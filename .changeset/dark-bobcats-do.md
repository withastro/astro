---
'astro': patch
---

Fixes `Astro.preferredLocaleList` returning an empty list when a locale is configured with the object form (`{ path, codes }`) and the browser sends the code with different casing or an underscore, such as `en-US` matching a configured `en-us`
