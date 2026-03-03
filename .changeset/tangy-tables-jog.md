---
'astro': minor
---

Adds a new optional `embeddedLangs` prop to the `<Code />` component to support languages beyond the primary `lang`

This allows, for example, highlighting `.vue` files with a `<script setup lang="tsx">` block correctly:

```astro
---
import {Code} from 'astro:components';

const code = `
<script setup lang="tsx">
const Text = ({ text }: { text: string }) => <div>{text}</div>;
</script>

<template>
  <Text text="hello world" />
</template>`
---
<Code {code} lang="vue" embeddedLangs={["tsx"]} />
```

See the [`<Code />` component documentation](https://v6.docs.astro.build/en/guides/syntax-highlighting/#code-) for more details.
