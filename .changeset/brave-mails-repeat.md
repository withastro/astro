---
'astro': patch
---

Adds support for `hydrationPolyfills` in renderers

Renderers can not specify polyfills that must run before the component code runs for hydration:

```js
export default {
  name: '@matthewp/my-renderer',
  server: './server.js',
  client: './client.js',
  hydrationPolyfills: ['./my-polyfill.js']
}
```

These will still wait for hydration to occur, but will run before the component script does.
