---
'astro': patch
---

Adds a new optional `embeddedLangs` prop to the `<Code />` component to support languages beyond the primary `lang`.

This e.g. allows us to highlight the tsx/jsx portion of a `vue` file that has a `<script setup lang="tsx">` block:

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

Without `embeddedLangs` informing shiki's `langs` option, the contents of a `<script setup lang="tsx">` section would fail to get highlighted.  See the min repro [on stackblitz](https://stackblitz.com/github/jfrancos/shiki-astro-min-repro) or [on github](https://github.com/jfrancos/shiki-astro-min-repro).