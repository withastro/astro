---
"astro": minor
---

Adds an option to suppress warning/errors in adapters' `supportedAstroFeatures`. This is useful when either an warning/error isn't applicable in a specific context or the default one might conflict and confuse users. 

To do so, you can add `suppress: "all"` (to suppress both the default and custom message) or `suppress: "default"` (to only suppress the default one):
```ts
setAdapter({
  name: 'my-astro-integration',
  supportedAstroFeatures: {
    staticOutput: "stable",
    hybridOutput: "stable",
    sharpImageService: {
      support: 'limited',
      message: 'The sharp image service isn't available in the deploy environment, but will be used by prerendered pages on build.',
      suppress: "default",
    },
  }
})
```
