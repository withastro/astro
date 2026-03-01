---
'@astrojs/netlify': patch
---

Fixes server-rendered routes returning 404 errors

A configuration error in the build output prevented Netlify from correctly routing requests to server-rendered pages, causing them to return 404 errors. This fix ensures that all server routes are properly handled by the Netlify SSR function.