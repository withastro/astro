---
'astro': minor
'@astrojs/vercel': patch
'@astrojs/netlify': patch
---

Adds a new `clientAddress` option to the `createContext()` function

Providing this value gives adapter and middleware authors explicit control over the client IP address. When not provided, accessing `clientAddress` throws an error consistent with other contexts where it is not set by the adapter.

Additionally, both of the official Netlify and Vercel adapters have been updated to provide this information in their edge middleware.

```js
import { createContext } from "astro/middleware";

createContext({
  clientAddress: context.headers.get("x-real-ip")
})
```
