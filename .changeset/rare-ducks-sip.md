---
'astro': patch
---

Adds a new **experimental** Astro Adapter Feature called `_experimentalHostedCspHeader`. 

When enabled, and the `experimental.csp` feature is enabled, Astro **won't** serve the CSP `<meta http-equiv="content-security-policy">` element in static pages;
instead the value of the header is served inside a map that can be retrieved from the hook `astro:build:generated`.

The name of the new field is called `_experimentalCspMapping` and it contains a map of `Map<IntegrationResolvedRoute, string>` where
the `string` type is the value of the heder for the current route e.g. `"script-src: 'self' sha256-yadayada; style-src: 'self' sha256-yadayada"
