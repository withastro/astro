---
'astro': patch
---

Improves `isPromise` utility to check the presence of `then` on an object before trying to access it - which can cause undesired side-effects on Proxy objects
