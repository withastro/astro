---
'astro': minor
---

The Inline Stylesheets RFC is now stable!

You can now control how Astro bundles your css with a configuration change:

```ts
export default defineConfig({
    ...
    build: {
        inlineStylesheets: "auto"
    }
    ...
})
```

The options:
- `inlineStylesheets: "never"`: This is the behavior you are familiar with. Every stylesheet is external, and added to the page via a `<link>` tag. Default.
- `inlineStylesheets: "auto"`: Small stylesheets are inlined into `<style>` tags and inserted into `<head>`, while larger ones remain external.
- `inlineStylesheets: "always"`: Every style required by the page is inlined.

As always, css files in the `public` folder are not affected.
