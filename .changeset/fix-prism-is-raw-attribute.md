---
'astro': patch
---

Fixes an issue where Prism syntax highlighting output included the `is:raw` attribute in the generated HTML, causing HTML validation errors. The `is:raw` directive is now properly removed from the output.
