---
'astro': major
---

### [deprecated]: `APIRoute` and `APIContext` types

In Astro v5.x, endpoints used confusingly named `APIRoute` and `APIContext` types.

Astro v6.0 exposes new `EndpointHandler` and `EndpointContext` types to better align with the documentation. The deprecated types will be removed in a future major version of Astro.

As a convenience, Astro v6.0 adds a new `defineEndpoint` utility from the `astro:endpoint` module.

#### What should I do?

Update your endpoints to use the `defineEndpoint` utility instead of manual type annotations.

```diff lang="ts"
- import type { APIContext, APIRoute } from 'astro';
+ import { defineEndpoint } from 'astro:endpoint';

- export const GET: APIRoute = ({ cookies }: APIContext) => {
+ export const GET = defineEndpoint(({ cookies }) => {
    cookies.set('user-id', '1', {
		path: '/',
		maxAge: 2592000,
	});

    return Response.json({
		message: "pong"
	})
- }
+ })
```

Alternatively, replace the `APIRoute` import with `EndpointHandler` and the `APIContext` import with `EndpointContext`.

```diff lang="ts"
- import type { APIRoute, APIContext } from 'astro';
+ import type { EndpointHandler, EndpointContext } from 'astro';
```
