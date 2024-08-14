---
"astro": minor
---

Adds a new property `meta` to Astro's [built-in `<Code />` component](https://docs.astro.build/en/reference/api-reference/#code-).

This allows you to provide a value for [Shiki's `meta` attribute](https://shiki.style/guide/transformers#meta) to pass options to transformers.

The following example passes an option to highlight lines 1 and 3 to Shiki's `tranformerMetaHighlight`:

```astro
---
// src/components/Card.astro
import { Code } from "astro:components";
import { transformerMetaHighlight } from '@shikijs/transformers';
---
<Code
  code={code}
  lang="js"
  transformers={[transformerMetaHighlight()]}
  meta="{1,3}" />
```
