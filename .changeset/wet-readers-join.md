---
'astro': minor
---

Shipped a new SSR mode, called `serverless`. 
When enabled, Astro will emit a file for each page, which will render one single page.

These files will be emitted inside `dist/pages`, and they will look like this:

```
├── pages
│   ├── blog
│   │   ├── entry._slug_.astro.mjs
│   │   └── entry.about.astro.mjs
│   └── entry.index.astro.mjs
```

To enable and customise this mode, new options are now available:

```js
export default defineConfig({
    output: "server",
    adapter: node({
        mode: "standalone"
    }),
    build: {
        split: "serverless",
        serverlessEntryPrefix: "main"
    }
})
```

- `ssrMode` accepts two values, `"server"` or `"serverless"`. Default value, `"server"`. 
- `serverlessEntryPrefix` allows to change the prefix of a serverless
