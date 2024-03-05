---
"astro": patch
---

Prerendering with the Speculation Rules API can fail---for example, [certain Chrome extensions can block prerendering](https://developer.chrome.com/blog/speculation-rules-improvements#chrome-limits). Currently in this case, neither prerendering or prefetching occurs. 

Adding `prefetch` in addition to `prerender` within the speculation rules script does not create an extra request. This change will allow browsers to fallback to prefetching if prerendering is not supported. 
