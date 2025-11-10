---
"astro": patch
---

Fixes an error when using `transition:persist` with components that use declarative Shadow DOM. Astro now avoids re-attaching a shadow root if one already exists, preventing `"Unable to re-attach to existing ShadowDOM"` navigation errors.
