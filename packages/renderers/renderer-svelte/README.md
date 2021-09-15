# @astrojs/renderer-svelte

This is a plugin for [Astro][astro] apps that enables server-side rendering of Svelte components.

## Installation

Install `@astrojs/renderer-svelte` and then add it to your `astro.config.mjs` in the `renderers` property:

```
npm install @astrojs/renderer-svelte
```

__astro.config.mjs__

```js
export default {
  // ...

  renderers: [
    // ...
    '@astrojs/renderer-svelte'
  ]
}
```

## Documentation

[Astro Renderer Documentation][renderer-docs]

[astro]: https://astro.build
[renderer-docs]: https://docs.astro.build/reference/renderer-reference
