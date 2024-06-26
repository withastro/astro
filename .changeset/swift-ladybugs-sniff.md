---
'astro': patch
---

Remove non-fatal errors from telemetry

Previously we tracked non-fatal errors in telemetry to get a good idea of the types of errors that occur in `astro dev`. However this has become noisy over time and results in a lot of data that isn't particularly useful. This removes those non-fatal errors from being tracked.
