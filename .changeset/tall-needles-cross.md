---
'astro': major
---

Allows `Astro.csp` and `context.csp` to be undefined instead of throwing errors when `csp: true` is not configured

When using the experimental Content Security Policy feature in Astro 5.x, `context.csp` was always defined but would throw if `experimental.csp` was not enabled in the Astro config. 

For the stable version of this API in Astro 6, `context.csp` can now be undefined if CSP is not enabled and its methods will never throw.

#### What should I do?

If you were using experimental CSP runtime utilities, you must now access methods conditionally:

```diff
-Astro.csp.insertDirective("default-src 'self'");
+Astro.csp?.insertDirective("default-src 'self'");
```
