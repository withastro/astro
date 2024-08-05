---
"astro": minor
---

Adds support for passing a metastring when using the Code component.

The following code is equivalent to doing `` ```js astro=cool `` in Markdown.

```astro
---
import { Code } from "astro:components";
---

<Code code="console.log('Hello, Astro!')" lang={"js"} meta="astro=cool" />
```
