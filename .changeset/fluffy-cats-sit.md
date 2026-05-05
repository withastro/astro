---
'astro': patch
---

Fixes `callAction` throwing `ActionCalledFromServerError` when called on a context created via `createContext` from `astro/middleware`. The action handler is now resolved directly from the actions entrypoint module as a fallback when no pipeline is attached to the context.
