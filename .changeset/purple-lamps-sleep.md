---
"@astrojs/solid-js": patch
---

Allow Solid ecosystem packages to not need special export map configuration. By default Solid is now treated as an external package in SSR, so any other dependent packages will receive the same instance.
