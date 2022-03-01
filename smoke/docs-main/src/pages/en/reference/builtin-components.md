---
layout: ~/layouts/MainLayout.astro
title: Built-In Components
---

Astro includes several builtin components for you to use in your projects. All builtin components are available via `import {} from 'astro/components';`.

## `<Code />`

```astro
---
import { Code } from 'astro/components';
---
<!-- Syntax highlight some JavaScript code. -->
<Code code={`const foo = 'bar';`} lang="js" />
<!-- Optional: customize your theme. -->
<Code code={`const foo = 'bar';`} lang="js" theme="dark-plus" />
<!-- Optional: Enable word wrapping. -->
<Code code={`const foo = 'bar';`} lang="js" wrap />
```

This component provides syntax highlighting for code blocks at build time (no client-side JavaScript included). The component is powered internally by shiki and it supports all popular [themes](https://github.com/shikijs/shiki/blob/main/docs/themes.md) and [languages](https://github.com/shikijs/shiki/blob/main/docs/languages.md). Plus, you can add your custom themes and languages by passing them to `theme` and `lang` respectively.

You can also use the `<Prism />` component for syntax highlighting powered by the [Prism](https://prismjs.com/) syntax highlighting library. This is the library that Astro’s Markdown uses by default. However, we will be transitioning all usage over to `<Code>` as we move towards our v1.0 release.

## `<Markdown />`

```astro
---
import { Markdown } from 'astro/components';
---
<Markdown>
  # Markdown syntax is now supported! **Yay!**
</Markdown>
```

See our [Markdown Guide](/en/guides/markdown-content) for more info.

<!-- TODO: We should move some of the specific component info here. -->

## `<Prism />`

```astro
---
import { Prism } from 'astro/components';
---
<Prism lang="js" code={`const foo = 'bar';`} />
```

This component provides language-specific syntax highlighting for code blocks. Since this never changes in the client it makes sense to use an Astro component (it’s equally reasonable to use a framework component for this kind of thing; Astro is server-only by default for all frameworks!).

See the [list of languages supported by Prism](https://prismjs.com/#supported-languages) where you can find a language’s corresponding alias. And, you can also display your Astro code blocks with lang="astro"!

## `<Debug />`

```astro
---
import Debug from 'astro/debug';
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
