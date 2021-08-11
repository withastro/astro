---
layout: ~/layouts/MainLayout.astro
title: Pagination
---

Astro supports built-in, automatic pagination for large collections of data that need to be split into multiple pages. Astro also automatically includes pagination metadata for things like previous/next page URL, total number of pages, and more.

## When to use pagination

Pagination is only useful when you need to generate multiple, numbered pages from a larger data set. 

If all of your data can fit on a single page then you should consider using a static [page component](/core-concepts/astro-pages) instead.

If you need to split your data into multiple pages but do not want those page URLs to be numbered, then you should use a [dynamic page](/core-concepts/routing) instead without pagination (Example: `/tag/[tag].astro`).

## How to use pagination

### Create your page component

To automatically paginate some data, you'll first need to create your page component. This is the component `.astro` file that every page in the paginated collection will inherit from.

Pagination is built on top of dynamic page routing, with the page number in the URL represented as a dynamic route param: `[page].astro` or `[...page].astro`. If you aren't familiar with routing in Astro, quickly familiarize yourself with our [Routing documentation](/core-concepts/routing) before continuing.

Your first page URL will be different depending on which type of query param you use:

- `/posts/[page].astro` will generate the URLs `/posts/1`, `/posts/2`, `/posts/3`, etc.
- `/posts/[...page].astro` will generate the URLs `/posts`, `/posts/2`, `/posts/3`, etc.

### calling the `paginate()` function

Once you have decided on the file name/path for your page component, you'll need to export a [`getStaticPaths()`](/reference/api-reference#getstaticpaths) function from the component. `getStaticPaths()` is where you tell Astro what pages to generate.

`getStaticPaths()` provides the `paginate()` function that we'll use to paginate your data. In the example below, we'll use `paginate()` to split a list of 150 Pokemon into 15 pages of 10 Pokemon each.

```js
export async function getStaticPaths({ paginate }) {
  // Load your data with fetch(), Astro.fetchContent(), etc.
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`);
  const result = await response.json();
  const allPokemon = result.results;
  // Return a paginated collection of paths for all posts
  return paginate(allPokemon, { pageSize: 10 });
}
// If set up correctly, The page prop now has everything that
// you need to render a single page (see next section).
const { page } = Astro.props;
```

`paginate()` generates the correct array of path objects for `getStaticPaths()`. This automatically tells Astro to create a new URL for every page of the collection. The page data will then be passed as a `page` prop to the `.astro` page component.

### using the `page` prop

Once you've set up your page component and defined your `getStaticPaths()` function, you're ready to design your page template. Each page in the paginated collection will be passed its data in the `page` prop.

```astro
---
export async function getStaticPaths { /* ... */ }
const { page } = Astro.props;
---
<h1>Page {page.currentPage}</h1>
<ul>
  {page.data.map(item => <li>{item.title}</h1>)}
</ul>
```

The `page` prop has several useful properties, but the most important one is `page.data`. This is the array containing the page's slice of data that you passed to the `paginate()` function. For example, if you called `paginate()` on an array of 150 Pokemon:

- `/1`: `page.data` would be an array of the first 10 Pokemon
- `/2`: `page.data` would be an array of Pokemon 11-20
- `/3`: `page.data` would be an array of Pokemon 21-30
- etc. etc.

The `page` prop includes other helpful metadata, like `page.url.next`, `page.url.prev`, `page.total`, and more. See our [API reference](/reference/api-reference#the-pagination-page-prop) for the full `page` interface.


## Nested pagination

A more advanced use-case for pagination is **nested pagination.** This is when pagination is combined with other dynamic route params. You can use nested pagination to group your paginated collection by some property or tag.

For example, if you want to group your paginated markdown posts by some tag, you would use nested pagination by creating a `/src/pages/[tag]/[page].astro` page that would match the following URLS:

- `/red/1` (tag=red)
- `/red/2` (tag=red)
- `/blue/1` (tag=blue)
- `/green/1` (tag=green)

Nested pagination works by returning an array of `paginate()` results from `getStaticPaths()`, one for each grouping. In the following example, we will implement nested pagination to build the URLs listed above:

```js
---
// Example: /src/pages/[tag]/[page].astro
export function getStaticPaths({paginate}) {
  const allTags = ['red', 'blue', 'green']; 
  const allPosts = Astro.fetchContent('../../posts/*.md');
  // For every tag, return a paginate() result.
  // Make sure that you pass `{params: {tag}}` to `paginate()`
  // so that Astro knows which tag grouping the result is for.
  return allTags.map((tag) => {
    const filteredPosts = allPosts.filter((post) => post.tag === tag);
    return paginate(filteredPosts, {
      params: { tag },
      pageSize: 10
    });
  });
}
const { page } = Astro.props;
const { params } = Astro.request;
```
