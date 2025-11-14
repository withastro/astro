---
"astro": patch
---

Server Islands slots are now encrypted server-side before being transmitted to the browser, matching the security model used for props. This improves the integrity of slot content and prevents injection attacks, even when component templates don't explicitly support slots.

Slots continue to work as expected for normal usage—this change has no breaking changes for legitimate requests.
