# @astrojs/renderer-svelte

This is a plugin for [Astro][astro] apps that enables server-side rendering of Svelte components.

## Installation

### `astro add`

You can install this renderer automatically by running:

```bash
astro add renderer svelte
```

### Manually

Install `@astrojs/renderer-svelte` and then add it to your `astro.config.mjs` in the `renderers` property:

```bash
npm install --save-dev svelte @astrojs/renderer-svelte
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
