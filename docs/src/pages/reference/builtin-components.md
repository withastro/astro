---
layout: ~/layouts/MainLayout.astro
title: Built-In Components
---

Astro includes several builtin components for you to use in your projects. All builtin components are available via `import {} from 'astro/components';`.

## `<Markdown />`

```astro
---
import { Markdown } from 'astro/components';
---
<Markdown>
  # Markdown syntax is now supported! **Yay!**
</Markdown>
```

See our [Markdown Guide](/guides/markdown-content) for more info.

<!-- TODO: We should move some of the specific component info here. -->

## `<Prism />`

```astro
---
import { Prism } from 'astro/components';
---
<Prism code={`const foo = 'bar';`} />
```

This component provides syntax highlighting for code blocks. Since this never changes in the client it makes sense to use an Astro component (it's equally reasonable to use a framework component for this kind of thing; Astro is server-only by default for all frameworks!).


## `<Debug />`

```astro
---
import { Debug } from 'astro/debug';
const serverObject = {
  a: 0,
  b: "string",
  c: {
    nested: "object"
  }
}
---
<Debug {serverObject} />
```

This component provides a way to inspect values on the clientside, without any JavaScript. 
