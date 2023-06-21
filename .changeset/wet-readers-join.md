---
'astro': minor
---

Shipped a new SSR build configuration mode: `split`. 
When enabled, Astro will "split" the single `entry.mjs` file and instead emit a separate file to render each individual page during the build process.

These files will be emitted inside `dist/pages`, mirroring the directory structure of your page files in `src/pages/`, for example:

```
├── pages
│   ├── blog
│   │   ├── entry._slug_.astro.mjs
│   │   └── entry.about.astro.mjs
│   └── entry.index.astro.mjs
```

To enable, set `build.split: true` in your Astro config:

```js
// src/astro.config.mjs
export default defineConfig({
    output: "server",
    adapter: node({
        mode: "standalone"
    }),
    build: {
        split: true
    }
})
```