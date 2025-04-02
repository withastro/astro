---
'astro': patch
---

Adds a new `session.load()` method to the experimental session API that allows you to load a session by ID.

When using [the experimental sessions API](https://docs.astro.build/en/reference/experimental-flags/sessions/), you don't normally need to worry about managing the session ID and cookies: Astro automatically reads the user's cookies and loads the correct session when needed. However, sometimes you need more control over which session to load. 

The new `load()` method allows you to manually load a session by ID. This is useful if you are handling the session ID yourself, or if you want to keep track of a session without using cookies. For example, you might want to restore a session from a logged-in user on another device, or work with an API endpoint that doesn't use cookies.

```ts
// src/pages/api/cart.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ session, request }) => {
  // Load the session from a header instead of cookies
  const sessionId = request.headers.get('x-session-id');
  await session.load(sessionId);
  const cart = await session.get('cart');
  return Response.json({ cart });
};
```

If a session with that ID doesn't exist, a new one will be created. This allows you to generate a session ID in the client if needed. 

For more information, see the [experimental sessions docs](https://docs.astro.build/en/reference/experimental-flags/sessions/).
