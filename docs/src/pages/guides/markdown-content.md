---
layout: ~/layouts/MainLayout.astro
title: Markdown
description: An intro to Markdown with Astro.
---

Astro comes with out-of-the-box Markdown support powered by the expansive [remark](https://remark.js.org/) ecosystem.

## Remark and Rehype Plugins

In addition to custom components inside the [`<Markdown>` component](/guides/markdown-content#astros-markdown-component), Astro comes with [GitHub-flavored Markdown](https://github.github.com/gfm/) support, [Footnotes](https://github.com/remarkjs/remark-footnotes) syntax, [Smartypants](https://github.com/silvenon/remark-smartypants), [Remark-slug](https://github.com/remarkjs/remark-slug) and syntax highlighting via [Prism](https://prismjs.com/) pre-enabled.

Also, Astro supports third-party plugins for Markdown. You can provide your plugins in `astro.config.mjs`.

> **Note:** Enabling custom `remarkPlugins` or `rehypePlugins` removes Astro's built-in support for [GitHub-flavored Markdown](https://github.github.com/gfm/) support, [Footnotes](https://github.com/remarkjs/remark-footnotes) syntax, [Smartypants](https://github.com/silvenon/remark-smartypants), [Remark-slug](https://github.com/remarkjs/remark-slug). You must explicitly add these plugins to your `astro.config.mjs` file, if desired.

### Add a Markdown plugin in Astro

If you want to add a plugin, you need to install the npm package dependency in your project and then update the `markdownOptions.remarkPlugins` or `markdownOptions.rehypePlugins` depends on what plugin you want to have:

```js
// astro.config.mjs
export default {
  markdownOptions: {
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
};
```

You can provide names of the plugins as well as import them:

```js
// astro.config.mjs
export default {
  markdownOptions: {
    remarkPlugins: [
      [import('remark-autolink-headings'), { behavior: 'prepend' }],
    ],
  },
};
```

## Markdown Pages

Astro treats any `.md` files inside of the `/src/pages` directory as pages. These files can contain frontmatter, but are otherwise processed as plain markdown files and do not support components. If you're looking to embed rich components in your markdown, take a look at the [Markdown Component](#astros-markdown-component) section.

### Layouts

Markdown pages have a special frontmatter property for `layout`. This defines the relative path to an `.astro` component which should wrap your Markdown content, for example a [Layout](/core-concepts/layouts) component. All other frontmatter properties defined in your `.md` page will be exposed to the component as properties of the `content` prop. The rendered Markdown content is placed into the default `<slot />` element.

```jsx
// src/pages/index.md
---
layout: ../../layouts/BaseLayout.astro
title: My cool page
---

# Hello World!
```

```jsx
// src/layouts/BaseLayout.astro
---
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

- Place them in the `public/` as explained on the [project-structure page](/core-concepts/project-structure/#public)
  - Example: Image is located at `/public/assets/img/astonaut.png` → Markdown: `![Astronaut](assets/img/astronaut.png)`
- Or use `import` as explained on the [imports page](/guides/imports#other-assets) (when using Astro's Markdown Component)

## Astro's Markdown Component

Astro has a dedicated component used to let you render your markdown as HTML components. This is a special component that is only exposed to `.astro` files. To use the `<Markdown>` component, within your frontmatter block use the following import statement:

```jsx
---
import { Markdown } from 'astro/components';
---
```

You can utilize this within your `.astro` file by doing the following:

```jsx
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

````jsx
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

    ```jsx
      // This content is not transformed!
      const object = { someOtherValue };
    ```

    - Rich component support like any `.astro` file!
    - Recursive Markdown support (Component children are also processed as Markdown)

    <MyFancyCodePreview client:visible>
      ```jsx
      const object = { someOtherValue };
      ```
    </MyFancyCodePreview client:visible>
  </Markdown>
</Layout>
````

## Remote Markdown

If you have Markdown in a remote source, you may pass it directly to the Markdown component through the `content` attribute. For example, the example below fetches the README from Snowpack's GitHub repository and renders it as HTML.

```jsx
---
import { Markdown } from 'astro/components';

const content = await fetch('https://raw.githubusercontent.com/snowpackjs/snowpack/main/README.md').then(res => res.text());
---

<Layout>
  <Markdown content={content} />
</Layout>
```

There might be times when you want to combine both dynamic, and static markdown. If that is the case, you can nest `<Markdown>` components with each other to get the best of both worlds.

```jsx
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
