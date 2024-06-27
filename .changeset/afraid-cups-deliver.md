---
'astro': patch
---

Adds a new option to the Container API to skip client side directives. This option should be used if you render a component that uses `client:*` directives.

```js
const container = await experimental_AstroContainer.create();
return await container.renderToResponse(Component, {
  skipClientDirectives: true,
});
```
