# @astrojs/renderer-vue

This is a plugin for [Astro][astro] apps that enables server-side rendering of Vue 3.x components.

## Installation

Install `@astrojs/renderer-vue` and then add it to your `astro.config.mjs` in the `renderers` property:

```
npm install @astrojs/renderer-vue
```

__astro.config.mjs__

```js
export default {
  // ...

  renderers: [
    // ...
    '@astrojs/renderer-vue'
  ]
}
```

## Documentation

[Astro Renderer Documentation][renderer-docs]

[astro]: https://astro.build
[renderer-docs]: https://docs.astro.build/reference/renderer-reference
