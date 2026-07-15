---
'astro': minor
---

Adds support for the more specific CSP directives `script-src-elem`, `script-src-attr`, `style-src-elem`, and `style-src-attr` through a new `kind` option.

Previously, [`CSP`](https://docs.astro.build/en/reference/configuration-reference/#securitycsp) was only scoped to generic `script-src`/`style-src` directives. Now each source or hash can be scoped to a narrower directive — for example, to allow inline `style` attributes (such as those from `define:vars` or Shiki) without loosening the policy for your `<style>` and `<link>` elements.

#### Scoping sources and hashes in your config

Each entry in `resources` and `hashes` can be an object with a `kind` property. Depending on whether you use `scriptDirective` or `styleDirective`, `"element"` targets `script-src-elem` or `style-src-elem`, `"attribute"` targets `script-src-attr` or `style-src-attr`, and `"default"` (the same as a bare string or hash) targets `script-src` or `style-src`.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  security: {
    csp: {
      scriptDirective: {
        resources: [{ resource: 'https://cdn.example.com', kind: 'element' }],
      },
      styleDirective: {
        resources: [{ resource: "'unsafe-inline'", kind: 'attribute' }],
      },
    },
  },
});
```

#### Scoping at runtime

The same `kind` option is available on the runtime CSP API, where the existing methods now also accept an object:

```js
ctx.csp.insertScriptResource({ resource: 'https://cdn.example.com', kind: 'element' });
ctx.csp.insertStyleResource({ resource: "'unsafe-inline'", kind: 'attribute' });
```
