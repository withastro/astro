---
'@astrojs/react': minor
---

Optionally parse React slots as React children.

This adds a new configuration option for the React integration `experimentalReactChildren`:

```js
export default {
  integrations: [
    react({
      experimentalReactChildren: true,
    })
  ]
}
```

With this enabled, children passed to React from Astro components via the default slot are parsed as React components.

This enables better compatibility with certain React components which manipulate their children.
