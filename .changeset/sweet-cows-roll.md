---
'@astrojs/netlify': minor
---

Added Incremental Static Regeneration support to the Netlify adapter.

To use this feature, you must have enabled builders mode and be using the serverless adapter.

```ts
import netlify from '@astrojs/netlify/functions'

export default defineConfig({
    ...
    adapter: netlify({ builders: true })
    ...
})
```

By default, all pages will be rendered on first visit and reused on every subsequent visit until you redeploy. To set a custom revalidation time, mutate the `netlify.builders.ttl` local in either your frontmatter or a middleware.

```astro
---
import Layout from '../components/Layout.astro'
// caches for 45 seconds
Astro.locals.netlify.builders.ttl = 45
---
<Layout title="Astro on Netlify">
    {new Date(Date.now())}
</Layout>
```

