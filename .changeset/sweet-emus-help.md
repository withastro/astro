---
'astro': major
---

### [deprecated]: `APIRoute` type annotations for endpoints
In Astro v5.x, endpoints were frequently authored using manual type annotations with the `APIRoute` type.

Astro v6.0 now includes a `defineEndpoint` utility to improve endpoint authoring. The new `EndpointHandler` type is identical to the deprecated `APIRoute` type.

#### What should I do?

Update endpoint definitions to use the `defineEndpoint` utility, removing any manual `APIRoute` and `APIContext` annotations.

```ts title="src/pages/api/ping.ts" ins="defineEndpoint(" ins=")\n" del=": APIRoute" del=": APIRoute" del="import type { APIContext, APIRoute } from 'astro';" ins="import { defineEndpoint } from 'astro:endpoint';"
import type { APIContext, APIRoute } from 'astro';
import { defineEndpoint } from 'astro:endpoint';

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

For code that still requires manual type annotations, replace `APIRoute` and `APIContext` types with `EndpointHandler` and `EndpointContext`.

```diff lang="ts"
- import { APIRoute } from 'astro';
+ import { defineEndpoint } from 'astro:endpoint';
- export const myEndpointHandler: APIRoute = (ctx) => { /* */ }
+ export const myEndpointHandler = defineEndpoint((ctx) => { /* */ })
```
