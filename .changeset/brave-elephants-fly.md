---
'astro': major
---

### [changed]: `entryPoint` type inside the hook `astro:build:ssr`
In Astro v4.x, the `entryPoint` type was `RouteData`.

Astro v5.0 the `entryPoint` type is `IntegrationRouteData`, which contains a subset of the `RouteData` type. The fields `isIndex` and `fallbackRoutes` were removed. 

#### What should I do?
Update your adapter to change the type of `entryPoint` from `RouteData` to `IntegrationRouteData`.

```diff
-import type {RouteData} from 'astro';
+import type {IntegrationRouteData} from "astro"

-function useRoute(route: RouteData) {
+function useRoute(route: IntegrationRouteData) {
  
}
```
