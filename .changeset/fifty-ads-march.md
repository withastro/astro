---
'astro': minor
---

## New properties for API routes

In API routes, you can now get the `site`, `generator`, `url`, `clientAddress`, `props`, and `redirect` fields on the APIContext, which is the first parameter passed to an API route. This was done to make the APIContext more closely align with the `Astro` global in .astro pages.

For example, here's how you might use the `clientAddress`, which is the user's IP address, to selectively allow users.

```js
export function post({ clientAddress, request, redirect }) {
  if(!allowList.has(clientAddress)) {
    return redirect('/not-allowed');
  }
}
```

Check out the docs for more information on the newly available fields: https://docs.astro.build/en/core-concepts/endpoints/#server-endpoints-api-routes
