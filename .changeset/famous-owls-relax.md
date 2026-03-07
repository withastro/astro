---
'@astrojs/vercel': patch
---

Fixes builds that were failing with "Entry module cannot be external" error when using the Vercel adapter

This error was preventing sites from building after recent internal changes. Your builds should now work as expected without any changes to your code.
