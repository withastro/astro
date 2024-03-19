---
"astro": patch
---

`<link>` tags created by astro for optimized stylesheets now do not include the closing forward slash. This slash is optional for void elements such as link, but made some html validation fail.
