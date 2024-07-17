---
'astro': minor
---

Refactors the type for integration hooks so that integration authors writing custom integration hooks can now allow runtime interactions between their integration and other integrations. 

This internal change should not break existing code for integration authors.

To declare your own hooks for your integration, extend the `Astro.IntegrationHooks` interface:

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

Call your hooks on all other integrations installed in a project at the appropriate time. For example, you can call your hook on initialization before either the Vite or Astro config have resolved:

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

Other integrations can also now declare your hooks:

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
