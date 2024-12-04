---
'astro': patch
---

Fixes an issue where the custom `assetFileNames` configuration caused assets to be incorrectly moved to the server directory instead of the client directory, resulting in 404 errors when accessed from the client side.
