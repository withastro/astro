---
layout: ~/layouts/MainLayout.astro
title: Pages
description: An intro to Astro pages, components that function as full pages.
---

**Pages** are a special type of [Astro Component](/en/core-concepts/astro-components) that handle routing, data loading, and templating for each page of your website. You can think of them like any other Astro component, just with extra responsibilities.

Astro also supports Markdown for content-heavy pages, like blog posts and documentation. See [Markdown Content](/en/guides/markdown-content) for more information on writing pages with Markdown.

## File-based Routing

Astro uses Pages to do something called **file-based routing.** Every file in your `src/pages` directory becomes a page on your site, using the file name to decide the final route.

Astro Components (`.astro`) and Markdown Files (`.md`) are the only supported formats for pages. Other page types (like a `.jsx` React component) are not supported, but you can use anything as a UI component inside of an `.astro` page to achieve a similar result.

```
src/pages/index.astro       -> mysite.com/
src/pages/about.astro       -> mysite.com/about
src/pages/about/index.astro -> mysite.com/about
src/pages/about/me.astro    -> mysite.com/about/me
src/pages/posts/1.md        -> mysite.com/posts/1
```

## Page Templating

All Astro components are responsible for returning HTML. Astro Pages return HTML as well, but have the unique responsibility of returning a full `<html>...</html>` page response, including `<head>` ([MDN<span class="sr-only">- head</span>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head)) and `<body>` ([MDN<span class="sr-only">- body</span>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body)).

`<!doctype html>` is optional, and will be added automatically.

```astro
---
// Example: HTML page skeleton
---
<!doctype html>
<html>
  <head>
    <title>Document title</title>
  </head>
  <body>
    <h1>Hello, world!</h1>
  </body>
</html>
```

## Data Loading

Astro pages can fetch data to help generate your pages. Astro provides two different tools to pages to help you do this: **fetch()** and **top-level await.**

📚 Read our [full guide](/en/guides/data-fetching) on data-fetching to learn more.

```astro
---
// Example: Astro component scripts run at build time
const response = await fetch('http://example.com/movies.json');
const data = await response.json();
console.log(data);
---
<!-- Output the result to the page -->
<div>{JSON.stringify(data)}</div>
```

## Custom 404 Error Page

For a custom 404 error page create a `404.astro` file in `/src/pages`. That builds to a `404.html` page. Most [deploy services](/en/guides/deploy) will find and use it.
This is special and different to the default behavior building `page.astro` (or `page/index.astro`) to `page/index.html`.
