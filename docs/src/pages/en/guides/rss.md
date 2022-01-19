---
layout: ~/layouts/MainLayout.astro
title: RSS
description: An intro to RSS in Astro
---

Astro supports fast, automatic RSS feed generation for blogs and other content websites. For more information about RSS feeds in general, see [aboutfeeds.com](https://aboutfeeds.com/).

You can create an RSS feed from any Astro page that uses a `getStaticPaths()` function for routing. Only dynamic routes can use `getStaticPaths()` today (see [Routing](/en/core-concepts/routing)).

> We hope to make this feature available to all other pages before v1.0. As a workaround, you can convert a static route to a dynamic route that only generates a single page. See [Routing](/en/core-concepts/routing) for more information about dynamic routes.

Create an RSS Feed by calling the `rss()` function that is passed as an argument to `getStaticPaths()`. This will create an `rss.xml` file in your final build based on the data that you provide using the `items` array.

```js
// Example: /src/pages/posts/[...page].astro
// Place this function inside your Astro component script.
export async function getStaticPaths({rss}) {
  const allPosts = Astro.fetchContent('../post/*.md');
  const sortedPosts = allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  // Generate an RSS feed from this collection
  rss({
    // The RSS Feed title, description, and custom metadata.
    title: 'Don\'s Blog',
    // See "Styling" section below
    stylesheet: true,
    description: 'An example blog on Astro',
    customData: `<language>en-us</language>`,
    // The list of items for your RSS feed, sorted.
    items: sortedPosts.map(item => ({
      title: item.title,
      description: item.description,
      link: item.url,
      pubDate: item.date,
    })),
    // Optional: Customize where the file is written to.
    // Otherwise, defaults to "/rss.xml"
    dest: "/my/custom/feed.xml",
  });
  // Return your paths
  return [...];
}
```

Note: RSS feeds will **not** be built during development. Currently, RSS feeds are only generated during your final build.

### Styling

RSS Feeds can be styled with an XSL stylesheet for a more pleasant user experience when they are opened directly in a browser. By default, Astro does not set a stylesheet for RSS feeds, but it can be enabled by setting the `stylesheet` option.

Astro can automatically use [Pretty Feed](https://github.com/genmon/aboutfeeds/blob/main/tools/pretty-feed-v3.xsl), a popular open-source XSL stylesheet. To enable this behavior, pass `stylesheet: true`. 

If you'd like to use a custom XSL stylesheet, you can pass a string value like `stylesheet: '/my-custom-stylesheet.xsl'`. This file should be in your `public/` directory (in this case, `public/my-custom-stylesheet.xsl`).
