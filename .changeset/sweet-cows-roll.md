---
'@astrojs/netlify': minor
---

If you are using Netlify's On-demand Builders, you can now specify how long should your pages remain cached. By default, all pages will be rendered on first visit and reused on every subsequent visit until you redeploy. To set a custom revalidation time, mutate the `netlify.builders.ttl` local in either your frontmatter or a middleware.

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

