# Routing

Non-public helpers live in `internal/`.

## create-manifest.ts

Public APIs:

- `RouteEntry`
- `createRoutesFromEntries`
- `createRoutesList`
- `resolveInjectedRoute`

Example:

```ts
import {
  createRoutesFromEntries,
  createRoutesList,
  resolveInjectedRoute,
} from './create-manifest.js';

const entries = [{ path: 'index.astro', isDir: false }];
const routes = createRoutesFromEntries(entries, settings, logger);
const routesList = await createRoutesList({ settings, cwd }, logger);
const resolved = resolveInjectedRoute('./src/pages/index.astro', settings.config.root);
```

## router.ts

Public APIs:

- `Router`
- `RouterMatch`
- `RouterOptions`

Example:

```ts
import { Router } from './router.js';

const router = new Router(routes, {
  base: '/',
  trailingSlash: 'ignore',
  buildFormat: 'directory',
});
const match = router.match('/');
```

## 3xx.ts

Public APIs:

- `redirectTemplate`

Example:

```ts
import { redirectTemplate } from './3xx.js';

const html = redirectTemplate({
  status: 301,
  absoluteLocation: 'https://example.com/new',
  relativeLocation: '/new',
});
```

## astro-designed-error-pages.ts

Public APIs:

- `ensure404Route`

Example:

```ts
import { ensure404Route } from './astro-designed-error-pages.js';

ensure404Route(manifest);
```

## default.ts

Public APIs:

- `DEFAULT_COMPONENTS`
- `createDefaultRoutes`

Example:

```ts
import { createDefaultRoutes, DEFAULT_COMPONENTS } from './default.js';

const routes = createDefaultRoutes(manifest);
const defaults = DEFAULT_COMPONENTS;
```

## dev.ts

Public APIs:

- `matchRoute`

Example:

```ts
import { matchRoute } from './dev.js';

const match = await matchRoute('/path', routesList, pipeline, manifest);
```

## helpers.ts

Public APIs:

- `getCustom404Route`
- `getCustom500Route`
- `getFallbackRoute`
- `routeIsFallback`
- `routeIsRedirect`

Example:

```ts
import {
  getCustom404Route,
  getCustom500Route,
  getFallbackRoute,
  routeIsFallback,
  routeIsRedirect,
} from './helpers.js';

const isRedirect = routeIsRedirect(route);
const isFallback = routeIsFallback(route);
const fallback = getFallbackRoute(route, routeList);
const custom404 = getCustom404Route(routesList);
const custom500 = getCustom500Route(routesList);
```

## match.ts

Public APIs:

- `isRequestServerIsland`
- `isRoute404or500`
- `isRouteExternalRedirect`
- `isRouteServerIsland`
- `matchAllRoutes`
- `matchRoute`
- `requestIs404Or500`

Example:

```ts
import {
  isRequestServerIsland,
  isRoute404or500,
  isRouteExternalRedirect,
  isRouteServerIsland,
  matchAllRoutes,
  matchRoute,
  requestIs404Or500,
} from './match.js';

const route = matchRoute('/path', manifest);
const matches = matchAllRoutes('/path', manifest);
const isError = route ? isRoute404or500(route) : false;
const isIsland = route ? isRouteServerIsland(route) : false;
const isExternal = route ? isRouteExternalRedirect(route) : false;
const isIslandRequest = isRequestServerIsland(request, base);
const isErrorRequest = requestIs404Or500(request, base);
```

## parse-route.ts

Public APIs:

- `parseRoute`

Example:

```ts
import { parseRoute } from './parse-route.js';

const routeData = parseRoute('blog/posts/[id].astro', config, {
  component: 'src/pages/blog/posts/[id].astro',
  prerender: true,
});
```

## params.ts

Public APIs:

- `stringifyParams`

Example:

```ts
import { stringifyParams } from './params.js';

const key = stringifyParams(params, route, trailingSlash);
```

## priority.ts

Public APIs:

- `routeComparator`

Example:

```ts
import { routeComparator } from './priority.js';

const sorted = routes.toSorted(routeComparator);
```

## request.ts

Public APIs:

- `getClientIpAddress`

Example:

```ts
import { getClientIpAddress } from './request.js';

const ip = getClientIpAddress(request);
```

## rewrite.ts

Public APIs:

- `copyRequest`
- `findRouteToRewrite`
- `getOriginPathname`
- `setOriginPathname`

Example:

```ts
import {
  copyRequest,
  findRouteToRewrite,
  getOriginPathname,
  setOriginPathname,
} from './rewrite.js';

const result = findRouteToRewrite({
  payload,
  routes,
  request,
  trailingSlash,
  buildFormat,
  base,
  outDir,
});
const nextRequest = copyRequest(result.newUrl, request, false, logger, result.routeData.route);
setOriginPathname(nextRequest, result.pathname, trailingSlash, buildFormat);
const origin = getOriginPathname(nextRequest);
```

## validation.ts

Public APIs:

- `validateDynamicRouteModule`
- `validateGetStaticPathsResult`

Example:

```ts
import { validateDynamicRouteModule, validateGetStaticPathsResult } from './validation.js';

validateGetStaticPathsResult(result, route);
validateDynamicRouteModule(mod, { ssr, route });
```

## pattern.ts

Public APIs:

- `getPattern`

Example:

```ts
import { getPattern } from './pattern.js';

const pattern = getPattern(segments, base, trailingSlash);
```

## parts.ts

Public APIs:

- `getParts`

Example:

```ts
import { getParts } from './parts.js';

const parts = getParts('[id]', 'src/pages/[id].astro');
```

## segment.ts

Public APIs:

- `validateSegment`

Example:

```ts
import { validateSegment } from './segment.js';

validateSegment('blog', 'src/pages/blog.astro');
```

## generator.ts

Public APIs:

- `getRouteGenerator`

Example:

```ts
import { getRouteGenerator } from './generator.js';

const generate = getRouteGenerator(segments, trailingSlash);
const path = generate({ id: '1' });
```

## prerender.ts

Public APIs:

- `getRoutePrerenderOption`

Example:

```ts
import { getRoutePrerenderOption } from './prerender.js';

await getRoutePrerenderOption(content, route, settings, logger);
```
