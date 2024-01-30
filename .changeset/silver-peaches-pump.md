---
"astro": patch
---

Updated `renderEndpoint` implementation to only append the reroute directive if the response HTTP status code is 404 or 500.
