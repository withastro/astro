---
'astro': patch
---

Add `Astro.generator` and built-in `Generator` component, which can be used to add a [`<meta name="generator">`](https://html.spec.whatwg.org/multipage/semantics.html#meta-generator) tag.

```astro
---
import { Generator } from 'astro/components'
---

<html>
  <head>
    <meta name="generator" content={Astro.generator} />
    <Generator />
  </head>
  <body>
    <footer>
      <p>Built with <a href="https://astro.build">{Astro.generator}</a></p>
    </footer>
  </body>
</html>
```
