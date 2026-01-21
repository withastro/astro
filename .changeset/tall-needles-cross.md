---
'astro': major
---

Makes `Astro.csp` and `context.csp` optional instead of throwing if CSP is not enabled

Until now, `context.csp` was always defined but would throw if CSP was not enabled in the Astro config. `context.csp` can now be undefined if CSP is not enabled and its methods will never throw.

#### What should I do?

If you are using CSP runtime utilities, access methods conditionally:

```diff
-Astro.csp.insertDirective("default-src 'self'");
+Astro.csp?.insertDirective("default-src 'self'");
```
