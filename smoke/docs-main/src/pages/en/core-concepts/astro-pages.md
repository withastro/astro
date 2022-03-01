---
layout: ~/layouts/MainLayout.astro
title: Pages
description: An introduction to Astro pages
---

**Pages** are a special type of [Astro component](/en/core-concepts/astro-components) that live in the `src/pages/` subdirectory. They are responsible for handling routing, data loading, and overall page layout for every HTML page in your website.

### File-based routing

Astro leverages a routing strategy called **file-based routing.** Every `.astro` file in your `src/pages` directory becomes a page on your site, creating a URL route based on the file path inside of the directory.

📚 Read more about [Routing in Astro](/en/core-concepts/routing)

### Page HTML

Astro Pages must return a full `<html>...</html>` page response, including `<head>` and `<body>`. (`<!doctype html>` is optional, and will be added automatically.)

```astro
---
// Example: src/pages/index.astro
---
<html>
  <head>
    <title>My Homepage</title>
  </head>
  <body>
    <h1>Welcome to my website!</h1>
  </body>
</html>
```

### Leveraging Page Layouts

To avoid repeating the same HTML elements on every page, you can move common `<head>` and `<body>` elements into your own [layout components](/en/core-components/layouts). You can use as many or as few layout components as you'd like.

```astro
---
// Example: src/pages/index.astro
import MySiteLayout from '../layouts/MySiteLayout.astro';
---
<MySiteLayout>
  <p>My page content, wrapped in a layout!</p>
</MySiteLayout>
```

📚 Read more about [layout components](/en/core-concepts/layouts) in Astro.


## Markdown Pages

Astro also treats any Markdown (`.md`) files inside of `/src/pages/` as pages in your final website. These are commonly used for text-heavy pages like blog posts and documentation. 

Page layouts are especially useful for [Markdown files.](#markdown-pages) Markdown files can use the special `layout` front matter property to specify a [layout component](/en/core-concepts/layout) that will wrap their Markdown content in a full `<html>...</html>` page document. 

```md
---
# Example: src/pages/page.md
layout: '../layouts/MySiteLayout.astro'
title: 'My Markdown page'
---
# Title

This is my page, written in **Markdown.**
```

📚 Read more about [Markdown](/en/guides/markdown-content) in Astro.


## Non-HTML Pages

> ⚠️ This feature is currently only supported with the `--experimental-static-build` CLI flag. This feature may be refined over the next few weeks/months as SSR support is finalized.

Non-HTML pages, like `.json` or `.xml`, can be built from `.js` and `.ts`. 

Built filenames and extensions are based on the source file's name, ex: `src/pages/data.json.ts` will be built to match the `/data.json` route in your final build.

📚 Read more about generating [non-HTML pages](https://docs.astro.build/en/core-concepts/astro-pages/#non-html-pages) in Astro.

## Custom 404 Error Page

For a custom 404 error page, you can create a `404.astro` file in `/src/pages`. 

This will build to a `404.html` page. Most [deploy services](/en/guides/deploy) will find and use it.