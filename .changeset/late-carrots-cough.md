---
'astro': major
---

Remove Vitest workaround for client environment imports

BREAKING CHANGE: Astro components can no longer be imported in Vitest tests configured with a "client" environment. Tests that render Astro components must now use an SSR environment (e.g., `environment: 'node'` in vitest.config.ts) to properly match the real-world Vite SSR environment.

## Who is affected?

You are affected **only if all three** of these conditions apply:

- You use Vitest to run tests, **and**
- You render `.astro` components (typically via the Container API), **and**
- Your test environment is set to `jsdom` or `happy-dom`

If you don't render Astro components in your tests, or if you already use the `node` environment, no changes are needed.

## What should I do?

Update your `vitest.config.ts` to use the `node` environment for tests that render Astro components:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

If you need to test both Astro components and browser-specific code, use Vitest's workspace configuration to separate them:
```ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'astro-components',
      environment: 'node',
      include: ['**/*.astro.test.ts'],
    },
  },
  {
    test: {
      name: 'browser',
      environment: 'happy-dom',
      include: ['**/*.browser.test.ts'],
    },
  },
]);
```