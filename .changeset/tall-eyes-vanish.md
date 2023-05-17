---
'astro': minor
---

Integrations can add new `client:` directives through the `astro:config:setup` hook's `addClientDirective()` API. To enable this API, the user needs to set `experimental.customClientDirectives` to `true` in their config.

```js
import { defineConfig } from 'astro/config';
import onClickDirective from 'astro-click-directive';

export default defineConfig({
  integrations: [onClickDirective()],
  experimental: {
    customClientDirectives: true
  }
});
```

```js
export default function onClickDirective() {
  return {
    hooks: {
      'astro:config:setup': ({ addClientDirective }) => {
        addClientDirective({
          name: 'click',
          entrypoint: 'astro-click-directive/click.js'
        });
      },
    }
  }
}
```

```astro
<Counter client:click />
```

The client directive file (e.g. `astro-click-directive/click.js`) should export a function of type `ClientDirective`:

```ts
import type { ClientDirective } from 'astro'

const clickDirective: ClientDirective = (load, opts, el) => {
  window.addEventListener('click', async () => {
    const hydrate = await load()
    await hydrate()
  }, { once: true })
}

export default clickDirective
```
