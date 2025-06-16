---
'@astrojs/underscore-redirects': major
---

- The type `Redirects` has been renamed to `HostRoutes`.
- `RouteDefinition.target` is now optional
- `RouteDefinition.weight` is now optional
- `Redirects.print` has been removed. Now you need to pass `Redirects` type to the `print` function

```diff
- redirects.print()
+ import { printAsRedirects } from "@astrojs/underscore-redirects"
+ printAsRedirects(redirects)
```
