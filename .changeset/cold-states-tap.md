---
'astro': minor
---

Adds support for experimental CSP Level 3 directives

CSP Level 3 introduces granular directives (`script-src-elem`, `script-src-attr`, `style-src-elem`, `style-src-attr`) that let you apply separate Content Security Policies to inline elements versus attributes. This gives you finer-grained control than the base `script-src` and `style-src` directives alone.

To enable this feature, add the experimental flag in your Astro config:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    cspLevel3: true,
  },
  security: {
    csp: {
      scriptElemDirective: {
        hashes: ['sha256-123'],
        resources: ['https://scripts.cdn.example.com/'],
      },
      styleElemDirective: {
        hashes: ['sha256-456'],
        resources: ['https://styles.cdn.example.com/'],
      },
      directives: [
        "script-src-attr 'none'",
        "style-src-attr 'unsafe-inline'",
      ],
    },
  },
});
```

This feature requires CSP to be enabled via `security.csp`. Auto-generated script and style hashes from `script-src` and `style-src` are automatically inherited into `script-src-elem` and `style-src-elem` when the feature is enabled and you have also configured hash or resource values for the corresponding CSP Level 3 directives.

You can also inject Level 3 resources and hashes at runtime via `Astro.csp`:

```astro
---
Astro.csp.insertScriptElemResource('https://scripts.cdn.example.com/');
Astro.csp.insertStyleElemHash('sha256-abc123');
---
```

For more information, see the [CSP header reference on MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy) and the [W3C CSP specification](https://w3c.github.io/webappsec-csp/).
