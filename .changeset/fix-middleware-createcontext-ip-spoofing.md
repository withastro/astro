---
'astro': minor
'@astrojs/vercel': patch
'@astrojs/netlify': patch
---

The `createContext()` function exported from `astro/middleware` now accepts an optional `clientAddress` parameter, giving adapter and middleware authors explicit control over the client IP address. When provided, `context.clientAddress` returns this value. When not provided, accessing `clientAddress` throws an error consistent with other contexts where no adapter has set it.

The Vercel and Netlify edge middleware integrations have been updated to pass the platform-provided client IP to `createContext()`.
