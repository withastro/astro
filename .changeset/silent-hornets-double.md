---
"astro": patch
---

Deprecate the markdown component in SSR. 

This was not working before, so now we make it official by throwing with a clean error message. See https://docs.astro.build/en/guides/markdown-content/#markdown-component to learn more.
