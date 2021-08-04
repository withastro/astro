---
layout: ~/layouts/MainLayout.astro
title: Pagination
---

Astro supports built-in, automatic pagination for large collections of data that need to be split into multiple pages. Astro also automatically includes pagination metadata for things like previous/next page URL, total number of pages, and more.

## When to use pagination

You only need pagination when you need a numbered collection of generated pages.

If all of your data can fit on a single page (like a single page list of all blog posts or products on a website) then you don't need pagination. A single [page component](/core-concepts/astro-pages) will do.

If you need to split your data into multiple pages but not using numbered pages (`/tag/foo` & `/tag/bar` instead of `/tag/1` & `/tag/2`) then a normal dynamic route param is what you need (Example: `src/pages/tag/[tag].astro`).

## How to use pagination

### Create your page component

To automatically paginate some data, you'll first need to create your page component. This is the component that every individual page in the collection will inherit from. 

Pagination is built on top of dynamic page routing, with the page number represented as a dynamic route param: `[page].astro` or `[...page].astro`. If you aren't familiar with routing in Astro, quickly familiarize yourself with our [Routing documentation](/core-concepts/routing) before continuing.

The `[page]` param becomes the page number in your URL. Your first page URL will be different depending on which type of query param you use:

- `/posts/[page].astro` will generate the URLs `/posts/1`, `/posts/2`, `/posts/3`, etc.
- `/posts/[...page].astro` will generate the URLs `/posts`, `/posts/2`, `/posts/3`, etc.

You can customize pagination to use any param name that you'd like, by passing a `param` option in the second argument of the `paginate()` function (see below).


### calling the `paginate()` function

Once you have decided on the file name/path for your page component, you'll need to export a `getStaticPaths()` function from the component. `getStaticPaths()` is needed so that Astro knows which pages to generate during your build. Without it, Astro would have no idea if you needed to build 100+ pages or just 2.

`getStaticPaths()` provides the `paginate()` function that we'll use to paginate your data. In the example below, we'll use `paginate()` to split a list of 150 Pokemon into 15 pages of 10 Pokemon each. 

```js
export async function getStaticPaths({ paginate }) {
  // Load your data with fetch(), Astro.fetchContent(), etc.
  const allPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`);
  const allPokemonResult = await allPokemonResponse.json();
  const allPokemon = allPokemonResult.results;
  // Return a paginated collection of paths for all posts
  return paginate(allPokemon, { pageSize: 10 });
}
// If set up correctly, The page prop now has everything that 
// you need to render a single page (see next section).
const { page } = Astro.props;
```

This works because `paginate()` automatically generates the correct array of path objects to return from `getStaticPaths()`. The function tells Astro to create a new URL for every page of the collection. The page number will be passed as a param, and the page data will be passed as a `page` prop.

### using the `page` prop

Once you've set up your page component and defined your `getStaticPaths()` function, you're ready to design your page template. Each page in the paginated collection will be passed the correct data for that page in the `page` prop.

The `page` prop has several useful properties, but the most important one is `page.data`. This is the array containing the page's slice of data that you passed to the `paginate()` function. For example, if you called `paginate()` on an array of 150 Pokemon:

- `/1`: `page.data` would be an array of the first 10 Pokemon
- `/2`: `page.data` would be an array of Pokemon 11-20
- `/3`: `page.data` would be an array of Pokemon 21-30
- etc. etc.

The `page` prop includes other helpful metadata, like `page.url.next`, `page.url.prev`, `page.total`, and more. See our [API reference](/reference/api-reference#the-pagination-page-prop) for the full `page` interface.



