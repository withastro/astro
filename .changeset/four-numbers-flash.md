---
'@astrojs/telemetry': patch
---

Fix telemetry crashing astro build/dev when using optional integrations

Telemetry will now ignore falsy integration values but will gather a count of how many integrations out of the total are now optional integrations