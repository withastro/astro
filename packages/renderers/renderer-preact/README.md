# @astrojs/renderer-preact

This is a plugin for [Astro][astro] apps that enables server-side rendering of Preact components.

## Installation

Install `@astrojs/renderer-preact` and then add it to your `astro.config.mjs` in the `renderers` property:

```
npm install @astrojs/renderer-preact
```

__astro.config.mjs__

```js
export default {
  // ...

  renderers: [
    // ...
    '@astrojs/renderer-preact'
  ]
}
```

## Documentation

[Astro Renderer Documentation][renderer-docs]

[astro]: https://astro.build
[renderer-docs]: https://docs.astro.build/reference/renderer-reference
