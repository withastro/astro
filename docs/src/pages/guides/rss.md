---
layout: ~/layouts/MainLayout.astro
title: RSS
---

Astro supports fast, automatic RSS feed generation for blogs and other content websites. 

You can create an RSS feed from any Astro page that uses a `getStaticPaths()` function for routing (only available to pages with dynamic route params, see (Routing)[/core-concepts/routing]). We hope to make this feature available to all pages before v1.0.

Create an RSS Feed by calling the `rss()` function that is passed as an argument to `getStaticPaths()`. This could be created from a list of local markdown files, remote data fetched from an API, or anything else you might want to return from the `items` array.

```js
// Example: /src/pages/posts/[...page].astro
// Place this function inside your Astro component script.
export async function getStaticPaths({rss}) {
  const allPosts = Astro.fetchContent('../post/*.md');
  const sortedPosts = allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  // Generate an RSS feed from this collection
  rss({
    // The RSS Feed title, description, and custom metadata.
    title: 'Don’s Blog',
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
  // Return a paginated collection of paths for all posts
  return [...];
}
```

Note that your RSS feed XML file will **not** appear during development. Currently, RSS feeds are only generated during your final build.
