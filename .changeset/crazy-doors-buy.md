---
'astro': minor
---

Adds the experimental support of Content Security Protection (CSP) in Astro. 

CSP is an important feature for website that require fine-grained control over the resources that can or cannot be downloaded and executed.

With this new experimental new feature, you can use most of Astro's features such as client islands, server islands, etc. and Astro will take care of everything.

The new feature has been designed to work in every environment out of the box (static pages, dynamic pages and single page applications), have maximum flexibility and type-safety in mind.

To enable the feature, you have to turn enable the following experimental flag:

```js
// astro.config.mjs
import { defineConfig } from "astro/config" 

export default defineConfig({
  experimental: {
    csp: true
  }
})
```

  
