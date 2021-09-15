# @astrojs/renderer-react

This is a plugin for [Astro][astro] apps that enables server-side rendering of React components.

## Installation

Install `@astrojs/renderer-react` and then add it to your `astro.config.mjs` in the `renderers` property:

```
npm install @astrojs/renderer-react
```

__astro.config.mjs__

```js
export default {
  // ...

  renderers: [
    // ...
    '@astrojs/renderer-react'
  ]
}
```

## Documentation

[Astro Renderer Documentation][renderer-docs]

[astro]: https://astro.build
[renderer-docs]: https://docs.astro.build/reference/renderer-reference
