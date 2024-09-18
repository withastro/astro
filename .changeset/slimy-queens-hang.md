---
'astro': minor
---

The value of the different properties on `supportedAstroFeatures` for adapters can now be objects, with a `support` and `message` properties. The content of the `message` property will be shown in the Astro CLI when the adapter is not compatible with the feature, allowing one to give a better informational message to the user.

This is notably useful with the new `limited` value, to explain to the user why support is limited.
