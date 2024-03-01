---
"astro": patch
---

Prerendering with the Speculation Rules API can fail---for example, certain Chrome extensions like LastPass can block prerendering, or browsers like Arc have disabled the feature. Currently in this case, neither prerendering or prefetching occurs. 

Adding a `link` tag in addition to the speculation rules script does not create an extra request. This change will append the speculation rules script, in addition to prefetching with `link` or `fetch` to ensure at least prefetching will occur. 
