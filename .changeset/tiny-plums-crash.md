---
'@astrojs/underscore-redirects': minor
---

Updates the input requirements of `createRedirectsFromAstroRoutes`:

- `routeToDynamicTargetMap` keys are `IntegrationResolvedRoute` instead of `IntegrationRouteData` (obtained from the `astro:routes:resolved` hook)
- There's a new `assets` property, that can be obtained from the `astro:build:done` hook

```js
function myIntegration() {
    let routes
    let buildOutput
    let config

    return {
        name: "my-integration",
        hooks: {
            "astro:routes:resolved": (params) => {
                routes = params.routes
            },
            "astro:config:done": (params) => {
                buildOutput = params.buildOutput
                config = params.config
            },
            "astro:build:done": (params) => {
                const redirects = createRedirectsFromAstroRoutes({
                    config,
                    buildOutput,
                    routeToDynamicTargetMap: new Map(
                        routes.map(route => [route, ''])
                    ),
                    dir: params.dir,
                    assets: params.assets
                })
            }
        }
    }
}
```