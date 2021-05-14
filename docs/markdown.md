## ✍️ Markdown

Astro comes with out-of-the-box Markdown support powered by the expansive [**remark**](https://github.com/remarkjs/remark) ecosystem.

## Remark Plugins

**This is the first draft of Markdown support!** While we plan to support user-provided `remark` plugins soon, our hope is that you won't need `remark` plugins at all!

In addition to [custom components inside the `<Markdown>` component](#markdown-component), Astro comes with [GitHub-flavored Markdown](https://github.github.com/gfm/) support, [Footnotes](https://github.com/remarkjs/remark-footnotes) syntax, [Smartypants](https://github.com/silvenon/remark-smartypants), and syntax highlighting via [Prism](https://prismjs.com/) pre-enabled. These features are likely to be configurable in the future.

### Markdown Pages

Astro treats any `.md` files inside of the `/src/pages` directory as pages. These pages are processed as plain Markdown files and do not support components. If you're looking to embed rich components in your Markdown, take a look at the [Markdown Component](#markdown-component) section.

#### `layout`

The only special Frontmatter key is `layout`, which defines the relative path to a `.astro` component which should wrap your Markdown content.

`src/pages/index.md`
```md
---
layout: ../layouts/main.astro
---

# Hello world!
```

Layout files are normal `.astro` components. Any Frontmatter defined in your `.md` page will be exposed to the Layout component as the `content` prop. `content` also has an `astro` key which holds special metadata about your file, like the complete Markdown `source` and a `headings` object.

The rendered Markdown content is placed into the default `<slot />` element.

`src/layouts/main.astro`
```jsx
---
export let content;
---

<html>
  <head>
    <title>{content.title}</title>
  </head>

  <body>
    <slot/>
  </body>
</html>
```

### Markdown Component

Similar to tools like [MDX](https://mdxjs.com/) or [MDsveX](https://github.com/pngwn/MDsveX), Astro makes it straightforward to embed rich, interactive components inside of your Markdown content. The `<Markdown>` component is statically rendered, so it does not add any runtime overhead.

Astro exposes a special `Markdown` component for `.astro` files which enables markdown syntax for its children **recursively**. Within the `Markdown` component you may also use plain HTML or any other type of component that is supported by Astro.

```jsx
---
// For now, this import _must_ be named "Markdown" and _must not_ be wrapped with a custom component
// We're working on easing these restrictions!
import Markdown from 'astro/components/Markdown.astro';
import Layout from '../layouts/main.astro';
import MyFancyCodePreview from '../components/MyFancyCodePreview.tsx';

const expressions = 'Lorem ipsum';
---

<Layout>
  <Markdown>
    # Hello world!

    **Everything** supported in a `.md` file is also supported here!

    There is _zero_ runtime overhead.

    In addition, Astro supports:
    - Astro {expressions}
    - Automatic indentation normalization
    - Automatic escaping of expressions inside code blocks

    ```jsx
      // This content is not transformed!
      const object = { someOtherValue };
    ```

    - Rich component support like any `.astro` file!
    - Recursive Markdown support (Component children are also processed as Markdown)

    <MyFancyCodePreview:visible>
      ```jsx
      const object = { someOtherValue };
      ```
    </MyFancyCodePreview:visible>
  </Markdown>
</Layout>
```

### Remote Markdown

If you have Markdown in a remote source, you may pass it directly to the Markdown component. For example, the example below fetches the README from Snowpack's GitHub repository and renders it as HTML.

```jsx
---
import Markdown from 'astro/components/Markdown.astro';

const content = await fetch('https://raw.githubusercontent.com/snowpackjs/snowpack/main/README.md').then(res => res.text());
---

<Layout>
  <Markdown>{content}</Markdown>
</Layout>
```

### Security FAQs

**Aren't there security concerns to rendering remote markdown directly to HTML?** 

Yes! Just like with regular HTML, improper use the `<Markdown>` component can open you up to a [cross-site scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) attack. If you are rendering untrusted content, be sure to _santize your content **before** rendering it_.

**Why not use a prop like React's `dangerouslySetInnerHTML={{ __html: content }}`?**

Rendering a string of HTML (or Markdown) is an extremely common use case when rendering a static site and you probably don't need the extra hoops to jump through. Rendering untrusted content is always dangerous! Be sure to _santize your content **before** rendering it_.
