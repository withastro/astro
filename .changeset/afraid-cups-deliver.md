---
'astro': patch
---

Adds a new function called `addClientRenderer` to the Container API.

This function should be used when rendering components using the `client:*` directives. The `addClientRenderer` API must be used
*after* the use of the `addServerRenderer`:

```js
const container = await experimental_AstroContainer.create();
container.addServerRenderer({renderer});
container.addClientRenderer({name: '@astrojs/react', entrypoint: '@astrojs/react/client.js'});
const response = await container.renderToResponse(Component);
```
