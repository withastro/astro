---
'@astrojs/netlify': minor
---

If you are using Netlify's On-demand Builders, you can now specify how long should your pages remain cached. By default, all pages will be rendered on first visit and reused on every subsequent visit until you redeploy. To set a custom revalidation time, call the `runtime.setBuildersTtl()` local in either your frontmatter or a middleware.

```astro
---
import Layout from '../components/Layout.astro'

if (import.meta.env.PROD) {
    // revalidates every 45 seconds
    Astro.locals.runtime.setBuildersTtl(45)
}
---
<Layout title="Astro on Netlify">
    {new Date(Date.now())}
</Layout>
```

