---
"astro": minor
---

Introduces new `Endpoint*` types as the preferred naming for endpoints

This change adds `EndpointRoute`, `EndpointContext`, `EndpointProps`, and `EndpointParams` as the new preferred types for defining endpoints in Astro. These types provide more discoverable and ergonomic naming that aligns with the documentation's terminology of "endpoints" rather than "API routes".

The existing `APIRoute`, `APIContext`, `APIProps`, and `APIParams` types are now deprecated aliases that will be removed in Astro 7.0. Full backward compatibility is maintained in the meantime.

**Migration:**

If you're using TypeScript with endpoints, you can optionally migrate to the new types:

```diff
- import type { APIRoute } from 'astro';
+ import type { EndpointRoute } from 'astro';

- export const GET: APIRoute = (context) => {
+ export const GET: EndpointRoute = (context) => {
    return new Response('Hello');
  };
```

```diff
- import type { APIContext } from 'astro';
+ import type { EndpointContext } from 'astro';

- export function GET({ params }: APIContext) {
+ export function GET({ params }: EndpointContext) {
    return new Response(`Hello ${params.id}`);
  }
```

The old `API*` types will continue to work without any changes required.
