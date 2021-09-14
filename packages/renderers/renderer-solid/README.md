# @astrojs/renderer-solid

This is a plugin for [Astro][astro] apps that enables server-side rendering of SolidJS components.

## Installation

Install `@astrojs/renderer-solid` and then add it to your `astro.config.mjs` in the `renderers` property:

```
npm install @astrojs/renderer-solid
```

__astro.config.mjs__

```js
export default {
  // ...

  renderers: [
    // ...
    '@astrojs/renderer-solid'
  ]
}
```

## Documentation

[Astro Renderer Documentation][renderer-docs]

[astro]: https://astro.build
[renderer-docs]: https://docs.astro.build/reference/renderer-reference
