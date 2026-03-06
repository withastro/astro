---
'astro': minor
'@astrojs/vercel': patch
'@astrojs/netlify': patch
---

Added `clientAddress` to the `createContext` function.

Both Netlify and Vercel adapters have been updated to provide this information in their edge middleware.

```js
import { createContext } from "astro/middleware";

createContext({
  clientAddress: context.headers.get("x-real-ip")
})
```
