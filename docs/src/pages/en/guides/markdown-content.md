---
layout: ~/layouts/MainLayout.astro
title: Markdown
description: An intro to Markdown with Astro.
---

Astro comes with out-of-the-box Markdown support powered by the expansive [remark](https://remark.js.org/) ecosystem.

## Parsers

Astro lets you use any Markdown parser you want. It just needs to be a function that follows the `MarkdownParser` type declared inside [this file](https://github.com/withastro/astro/blob/main/packages/astro/src/@types/astro.ts). You can declare it inside `astro.config.mjs`:

```js
// astro.config.mjs
export default {
  markdownOptions: {
    render: [
      'parser-name', // or import('parser-name') or (contents) => {...}
      {
        // options
      },
    ],
  },
};
```

Astro comes with the `@astrojs/markdown-remark` package - the default parser.

### Remark and Rehype Plugins

In addition to custom components inside the [`<Markdown>` component](/en/guides/markdown-content#astros-markdown-component), the default parser comes with these plugins pre-enabled:

- [GitHub-flavored Markdown](https://github.com/remarkjs/remark-gfm)
- [remark-smartypants](https://github.com/silvenon/remark-smartypants)
- [rehype-slug](https://github.com/rehypejs/rehype-slug)

Also, Astro supports third-party plugins for Markdown. You can provide your plugins in `astro.config.mjs`.

> **Note:** Enabling custom `remarkPlugins` or `rehypePlugins` removes Astro's built-in support for the plugins previously mentioned. You must explicitly add these plugins to your `astro.config.mjs` file, if desired.

### Add a Markdown plugin in Astro

If you want to add a plugin, you need to install the npm package dependency in your project and then update `remarkPlugins` or `rehypePlugins` inside the `@astrojs/markdown-remark` options depending on what plugin you want to have:

```js
// astro.config.mjs
export default {
  markdownOptions: {
    render: [
      '@astrojs/markdown-remark',
      {
        remarkPlugins: [
          // Add a Remark plugin that you want to enable for your project.
          // If you need to provide options for the plugin, you can use an array and put the options as the second item.
          // ['remark-autolink-headings', { behavior: 'prepend'}],
        ],
        rehypePlugins: [
          // Add a Rehype plugin that you want to enable for your project.
          // If you need to provide options for the plugin, you can use an array and put the options as the second item.
          // 'rehype-slug',
          // ['rehype-autolink-headings', { behavior: 'prepend'}],
        ],
      },
    ],
  },
};
```

You can provide names of the plugins as well as import them:

```js
import autolinkHeadings from 'remark-autolink-headings';

// astro.config.mjs
export default {
  markdownOptions: {
    render: [
      '@astrojs/markdown-remark',
      {
        remarkPlugins: [[autolinkHeadings, { behavior: 'prepend' }]],
      },
    ],
  },
};
```

### Syntax Highlighting

Astro comes with built-in support for [Prism](https://prismjs.com/) and [Shiki](https://shiki.matsu.io/). By default, Prism is enabled. You can modify this behavior by updating the `@astrojs/markdown-remark` options:

```js
// astro.config.mjs
export default {
  markdownOptions: {
    render: [
      '@astrojs/markdown-remark',
      {
        // Pick a syntax highlighter. Can be 'prism' (default), 'shiki' or false to disable any highlighting.
        syntaxHighlight: 'prism',
        // If you are using shiki, here you can define a global theme and
        // add custom languages.
        shikiConfig: {
          theme: 'github-dark',
          langs: [],
          wrap: false,
        },
      },
    ],
  },
};
```

You can read more about custom Shiki [themes](https://github.com/shikijs/shiki/blob/main/docs/themes.md#loading-theme) and [languages](https://github.com/shikijs/shiki/blob/main/docs/languages.md#supporting-your-own-languages-with-shiki).

## Markdown Pages

Astro treats any `.md` files inside of the `/src/pages` directory as pages. These files can contain frontmatter, but are otherwise processed as plain markdown files and do not support components. If you're looking to embed rich components in your markdown, take a look at the [Markdown Component](#astros-markdown-component) section.

### Layouts

Markdown pages have a special frontmatter property for `layout`. This defines the relative path to an `.astro` component which should wrap your Markdown content, for example a [Layout](/en/core-concepts/layouts) component. All other frontmatter properties defined in your `.md` page will be exposed to the component as properties of the `content` prop. The rendered Markdown content is placed into the default `<slot />` element.

```markdown
---
# src/pages/index.md
layout: ../layouts/BaseLayout.astro
title: My cool page
draft: false
---

# Hello World!
```

```astro
---
// src/layouts/BaseLayout.astro
const { content } = Astro.props;
---
<html>
  <head>
    <title>{content.title}</title>
  </head>

  <body>
    <slot />
  </body>
</html>
```

For Markdown files, the `content` prop also has an `astro` property which holds special metadata about the page such as the complete Markdown `source` and a `headers` object. An example of what a blog post `content` object might look like is as follows:

```json
{
  /** Frontmatter from a blog post
  "title": "Astro 0.18 Release",
  "date": "Tuesday, July 27 2021",
  "author": "Matthew Phillips",
  "description": "Astro 0.18 is our biggest release since Astro launch.",
  "draft": false,
  **/
  "astro": {
    "headers": [
      {
        "depth": 1,
        "text": "Astro 0.18 Release",
        "slug": "astro-018-release"
      },
      {
        "depth": 2,
        "text": "Responsive partial hydration",
        "slug": "responsive-partial-hydration"
      }
      /* ... */
    ],
    "source": "# Astro 0.18 Release\\nA little over a month ago, the first public beta [...]"
  },
  "url": ""
}
```

> Keep in mind that the only guaranteed properties coming from the `content` prop are `astro` and `url`.

### Images and videos

Using images or videos follows Astro's normal import rules:

- Place them in the `public/` as explained on the [project-structure page](/en/core-concepts/project-structure/#public)
  - Example: Image is located at `/public/assets/img/astonaut.png` → Markdown: `![Astronaut](/assets/img/astronaut.png)`
- Or use `import` as explained on the [imports page](/en/guides/imports#other-assets) (when using Astro's Markdown Component)

### Markdown draft pages

Markdown pages which have the property `draft` set in their frontmatter are referred to as "draft pages". By default, Astro excludes these pages from the build when building the static version of your page (i.e `astro build`), which means that you can exclude draft/incomplete pages from the production build by setting `draft` to `true`. To enable building of draft pages, you can set `buildOptions.drafts` to `true` in the configuration file, or pass the `--drafts` flag when running `astro build`. Markdown pages which do not have the `draft` property set are not affected. An example of a markdown draft page can be:

```markdown
---
# src/pages/blog-post.md
title: My Blog Post
draft: true
---

This is my blog post which is currently incomplete.
```

An example of a markdown post which is not a draft:

```markdown
---
# src/pages/blog-post.md
title: My Blog Post
draft: false
---

This is my blog post...
```

> This feature only applies to local markdown pages, not the `<Markdown />` component, or remote markdown.

## Astro's Markdown Component

Astro has a dedicated component used to let you render your markdown as HTML components. This is a special component that is only exposed to `.astro` files. To use the `<Markdown>` component, within your frontmatter block use the following import statement:

```astro
---
import { Markdown } from 'astro/components';
---
```

You can utilize this within your `.astro` file by doing the following:

```astro
---
import { Markdown } from 'astro/components';
---

<Layout>
  <Markdown>
    # Hello world!

    The contents inside here is all in markdown.
  </Markdown>
</Layout>
```

`<Markdown>` components provide more flexibility and allow you to use plain HTML or custom components. For example:

````astro
---
// For now, this import _must_ be named "Markdown" and _must not_ be wrapped with a custom component
// We're working on easing these restrictions!
import { Markdown } from 'astro/components';
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

    ```js
      // This content is not transformed!
      const object = { someOtherValue };
    ```

    - Rich component support like any `.astro` file!
    - Recursive Markdown support (Component children are also processed as Markdown)

    <MyFancyCodePreview client:visible>
      ```js
      const object = { someOtherValue };
      ```
    </MyFancyCodePreview client:visible>
  </Markdown>
</Layout>
````

## Remote Markdown

If you have Markdown in a remote source, you may pass it directly to the Markdown component through the `content` attribute. For example, the example below fetches the README from Snowpack's GitHub repository and renders it as HTML.

```astro
---
import { Markdown } from 'astro/components';

const content = await fetch('https://raw.githubusercontent.com/snowpackjs/snowpack/main/README.md').then(res => res.text());
---

<Layout>
  <Markdown content={content} />
</Layout>
```

There might be times when you want to combine both dynamic, and static markdown. If that is the case, you can nest `<Markdown>` components with each other to get the best of both worlds.

```astro
---
import { Markdown } from 'astro/components';

const content = await fetch('https://raw.githubusercontent.com/snowpackjs/snowpack/main/README.md').then(res => res.text());
---

<Layout>
  <Markdown>
    ## Markdown example

    Here we have some __Markdown__ code. We can also dynamically render content from remote places.

    <Markdown content={content} />
  </Markdown>
</Layout>
```

## Security FAQs

**Aren't there security concerns to rendering remote markdown directly to HTML?**

Yes! Just like with regular HTML, improper use of the `Markdown` component can open you up to a [cross-site scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) attack. If you are rendering untrusted content, be sure to _sanitize your content **before** rendering it_.

**Why not use a prop like React's `dangerouslySetInnerHTML={{ __html: content }}`?**

Rendering a string of HTML (or Markdown) is an extremely common use case when rendering a static site and you probably don't need the extra hoops to jump through. Rendering untrusted content is always dangerous! Be sure to _sanitize your content **before** rendering it_.
