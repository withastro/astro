---
'astro': minor
---

Refactor type for integration hooks to be extensible from an interface on the global `Astro` namespace.

To declare your own hooks for integrations extend the interface by adding the following code in your integration:

```ts
// your-integration/types.ts
declare global {
  namespace Astro {
    interface IntegrationHooks {
      'myLib:eventHappened': (your: string, parameters: number) => Promise<void>;
    }
  }
}
```

Call your hooks on all integrations when you want to trigger them:

```ts
// your-integration/index.ts
import './types.ts';

export default (): AstroIntegration => {
  return {
    name: 'your-integration',
    hooks: {
      'astro:config:setup': async ({ config }) => {
        for (const integration of config.integrations) {
          await integration.hooks['myLib:eventHappened'].?('your values', 123);
        }
      },
    }
  }
}
```

Other integrations can now declare your hooks:

```ts
// other-integration/index.ts
import 'your-integration/types.ts';

export default (): AstroIntegration => {
  return {
    name: 'other-integration',
    hooks: {
      'myLib:eventHappened': async (your, values) => {
        // ...
      },
    }
  }
}
```
