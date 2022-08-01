# @astrojs/prism

Supports Prism highlighting in Astro projects

## Component

This package exports a component to support highlighting inside an Astro file. Example:

```astro
---
import { Prism } from "@astrojs/prism"
---

<Prism lang="js" code={`const foo = 'bar';`} />
```

## Internal

This package exports a `runHighlighterWithAstro` function inside `internal.ts` to make sure the Astro language is loaded when highlighting code

```typescript
import { runHighlighterWithAstro } from '@astrojs/prism/dist/internal';

runHighlighterWithAstro(`
  ---
    const helloAstro = 'Hello, Astro!';
  ---

  <div>{helloAstro}</div>
`, 'astro');
```
