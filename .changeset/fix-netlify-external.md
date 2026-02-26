---
'@astrojs/netlify': patch
---

Fixes builds that were failing with "Entry module cannot be external" error when using the Netlify adapter

This error was preventing sites from building after recent internal changes. Your builds should now work as expected without any changes to your code.