---
'astro': minor
---

Adds [`ShikiTransformer`](https://shiki.style/packages/transformers#shikijs-transformers) support to the [`<Code />`](https://docs.astro.build/en/reference/api-reference/#code-) component with a new `transformers` prop.

```astro
---
import { transformerNotationFocus } from '@shikijs/transformers'
import { Code } from 'astro:components'

const code = `const foo = 'hello'
const bar = ' world'
console.log(foo + bar) // [!code focus]
`
---

<Code {code} lang="js" transformers={[transformerNotationFocus()]} />

<style is:global>
  pre.has-focused .line:not(.focused) {
    backdrop-filter: blur(1px);
  }
</style>
```
