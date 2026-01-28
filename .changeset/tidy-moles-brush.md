---
'astro': minor
---

Adds optional `placement` config option for the dev toolbar.

You can now configure the default toolbar position (`'bottom-left'`, `'bottom-center'`, or `'bottom-right'`) via `devToolbar.placement` in your Astro config. This option is helpful for sites with UI elements (chat widgets, cookie banners) that are consistently obscured by the toolbar in the dev environment.

You can set a project default that is consistent across environments (e.g. dev machines, browser instances, team members):

```js
// astro.config.mjs
export default defineConfig({
  devToolbar: {
    placement: 'bottom-left',
  },
});
```

User preferences from the toolbar UI (stored in `localStorage`) still take priority, so this setting can be overridden in individual situations as necessary.
