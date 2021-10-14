---
layout: ~/layouts/MainLayout.astro
title: Layouts
description: An intro to layouts, a type of Astro component that is shared between pages for common layouts.
---

**Layouts** are a special type of [Component](/core-concepts/astro-components) that help you share and reuse common page layouts within your project.

Layouts are just like any other reusable Astro component. There's no new syntax or APIs to learn. However, reusable page layouts are such a common pattern in web development that we created this guide to help you use them.

## Usage

Astro layouts support props, slots, and all of the other features of Astro components. Layouts are just normal components, after all!

Unlike other components, layouts will often contain the full page `<html>`, `<head>` and `<body>` (often referred to as the **page shell**).

It's a common pattern to put all of your layout components in a single `src/layouts` directory.

## Example

```astro
---
// src/layouts/BaseLayout.astro
const {title} = Astro.props;
---
<html>
  <head>
    <title>Example Layout: {title}</title>
  </head>
  <body>
    <!-- Adds a navigation bar to every page. -->
    <nav>
      <a href="#">Home</a>
      <a href="#">Posts</a>
      <a href="#">Contact</a>
    </nav>
    <!-- slot: your page content will be injected here. -->
    <slot />
  </body>
</html>
```

📚 The `<slot />` element lets Astro components define where any children elements (passed to the layout) should go. Learn more about how `<slot/>` works in our [Astro Component guide.](/core-concepts/astro-components)

Once you have your first layout, you can use it like you would any other component on your page. Remember that your layout contains your page `<html>`, `<head>`, and `<body>`. You only need to provide the custom page content.

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro'
---
<BaseLayout title="Homepage">
  <h1>Hello, world!</h1>
  <p>This is my page content. It will be nested inside a layout.</p>
</BaseLayout>
```

## Nesting Layouts

You can nest layouts when you want to create more specific page types without copy-pasting. It is common in Astro to have one generic `BaseLayout` and then many more specific layouts (`PostLayout`, `ProductLayout`, etc.) that reuse and build on top of it.

```astro
---
// src/layouts/PostLayout.astro
import BaseLayout from '../layouts/BaseLayout.astro'
const {title, author} = Astro.props;
---
  <!-- This layout reuses BaseLayout (see example above): -->
<BaseLayout title={title}>
  <!-- Adds new post-specific content to every page. -->
  <div>Post author: {author}</div>
  <!-- slot: your page content will be injected here. -->
  <slot />
</BaseLayout>
```

## Composing Layouts

Sometimes, you need more granular control over your page. For instance, you may want to add SEO or social `meta` tags on some pages, but not others. You could implement this with a prop on your layout (`<BaseLayout addMeta={true} ...`) but at some point it may be easier to compose your layouts without nesting.

Instead of defining your entire `<html>` page as one big layout, you can define the `head` and `body` contents as smaller, separate components. This lets you compose multiple layouts together in unique ways on every page.

```astro
---
// src/layouts/BaseHead.astro
const {title, description} = Astro.props;
---
<meta charset="UTF-8">
<title>{title}</title>
<meta name="description" content={description}>
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
```

Notice how this layout doesn't include your page shell, and only includes some generic elements that should go in your `<head>`. This lets you combine multiple layout components together with more control over the overall page structure.

```astro
---
// src/pages/index.astro
import BaseHead from '../layouts/BaseHead.astro';
import OpenGraphMeta from '../layouts/OpenGraphMeta.astro';
---
<html>
  <head>
    <!-- Now, you have complete control over the head, per-page. -->
    <BaseHead title="Page Title" description="Page Description" />
    <OpenGraphMeta />
    <!-- You can even add custom, one-off elements as needed. -->
    <link rel="alternate" type="application/rss+xml" href="/feed/posts.xml">
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

The one downside to this approach is that you'll need to define the `<html>`, `<head>`, and `<body>` elements on every page yourself. This is needed to construct the page because the layout components no longer contain the full page shell.

## Markdown Layouts

Layouts are essential for Markdown files. Markdown files can declare a layout in the file frontmatter. Each Markdown file will be rendered to HTML and then injected into the layout's `<slot />` location.

```markdown
---
title: Blog Post
layout: ../layouts/PostLayout.astro
---

This blog post will be **rendered** inside of the `<PostLayout />` layout.
```

Markdown pages always pass a `content` prop to their layout, which is useful to grab information about the page, title, metadata, table of contents headers, and more.

```astro
---
// src/layouts/PostLayout.astro
const { content } = Astro.props;
---
<html>
  <head>
    <title>{content.title}</title>
  </head>
  <body>
    <h1>{content.title}</h1>
    <h2>{content.description}</h2>
    <img src={content.image} alt="">
    <article>
      <!-- slot: Markdown content goes here! -->
      <slot />
    </article>
  </body>
</html>
```

📚 Learn more about Astro's markdown support in our [Markdown guide](/guides/markdown-content).
