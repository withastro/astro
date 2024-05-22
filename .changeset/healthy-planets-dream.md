---
"astro": minor
---

Updates Astro's code for adapters to use the header `x-forwarded-for` to initialize the `clientAddress`.

To take advantage of the new change, integration authors must upgrade the version of Astro in their adapter `peerDependencies` to `4.9.0`.
