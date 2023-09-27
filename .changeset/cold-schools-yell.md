---
'astro': minor
---

Support adding integrations dynamically

Astro integrations can now themselves dynamically add and configure additional integrations during set-up. This makes it possible for integration authors to bundle integrations more intelligently for their users.

In the following example, a custom integration checks whether `@astrojs/sitemap` is already configured. If not, the integration adds Astro’s sitemap integration, passing any desired configuration options:

```ts
import sitemap from '@astrojs/sitemap';
import type { AstroIntegration } from 'astro';

const MyIntegration = (): AstroIntegration => {
  return {
    name: 'my-integration',

    'astro:config:setup': ({ config, updateConfig }) => {
      // Look for sitemap in user-configured integrations.
      const userSitemap = config.integrations.find(
        ({ name }) => name === '@astrojs/sitemap'
      );

      if (!userSitemap) {
        // If sitemap wasn’t found, add it.
        updateConfig({
          integrations: [sitemap({ /* opts */ }],
        });
      }
    },
  };
};
```
