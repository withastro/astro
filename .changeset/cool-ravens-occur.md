---
'astro': patch
---

Add user-configurable `sitemapFilter` option.

This option can be used to ensure certain pages are excluded from your final sitemap.

```ts
// astro.config.ts
import type { AstroUserConfig } from 'astro'

const config: AstroUserConfig = {
  sitemap: true,
  sitemapFilter: (page: string) => !page.includes('secret-page')
}
export default config
```
