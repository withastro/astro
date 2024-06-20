---
'astro': minor
'@astrojs/db': minor
---

Refactor type for integration hooks to be extensible from an interface on the global `Astro` namespace.

To declare your own hooks for integrations extend the interface like so:

```ts
declare global {
  namespace Astro {
    interface IntegrationHooks {
      'myLib:eventHappened': (your: string, parameters: number) => Promise<void>;
    }
  }
}
```
