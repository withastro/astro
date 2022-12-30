---
'astro': major
---

Remove `buildConfig` option parameter from integration `astro:build:start` hook in favour of the `build.config` option in the `astro:config:setup` hook.

```js
export default function myIntegration() {
  return {
    name: 'my-integration',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          build: {
            client: '...',
            server: '...',
            serverEntry: '...',
          },
        });
      },
    },
  };
}
```
