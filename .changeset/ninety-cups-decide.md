---
'astro': patch
---

Adds a new function called `insertPageRoute` to the Astro Container API.

The new function is useful when testing routes that, for some business logic, use `Astro.rewrite`.

For example, if you have a route `/blog/post` and for some business decision there's a rewrite to `/generic-error`, the container API implementation will look like this:

```js
import Post from "../src/pages/Post.astro";
import GenericError from "../src/pages/GenericError.astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";

const container = await AstroContainer.create();
container.insertPageRoute("/generic-error", GenericError);
const result = await container.renderToString(Post);
console.log(result) // this should print the response from GenericError.astro
```

This new method only works for page routes, which means that endpoints aren't supported.
