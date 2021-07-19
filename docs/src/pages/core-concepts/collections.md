---
layout: ~/layouts/Main.astro
title: Collections
---

**Collections** are a special type of [Page](/core-concepts/astro-pages) that help you generate multiple pages from a larger set of data. Example use-cases include:

- Pagination: `/posts/1`, `/posts/2`, etc.
- Grouping content by author: `/author/fred`, `/author/matthew`, etc.
- Grouping content by some tag: `/tags/red`, `/tags/blue`, etc.
- Working with remote data
- Mixing remote and local data

**Use a Collection when you need to generate multiple pages from a single template.** If you just want to generate a single page (ex: a long list of every post on your site) then you can just fetch that data on a normal Astro page without using the Collection API.

## Using Collections

To create a new Astro Collection, you must do three things:

1. Create a new file in the `src/pages` directory that starts with the `$` symbol. This is required to enable the Collections API.

- Example: `src/pages/$posts.astro` -> `/posts/1`, `/posts/2`, etc.
- Example: `src/pages/$tags.astro` -> `/tags/:tag` (or `/tags/:tag/1`)

2. Define and export the `collection` prop: `collection.data` is how you'll access the data for every page in the collection. Astro populates this prop for you automatically. It MUST be named `collection` and it must be exported.

- Example: `const { collection } = Astro.props;`

3. Define and export `createCollection` function: this tells Astro how to load and structure your collection data. Check out the examples below for documentation on how it should be implemented. It MUST be named `createCollection` and it must be exported.

- Example: `export async function createCollection() { /* ... */ }`
- API Reference: [createCollection](/reference/api-reference#collections-api)

## Example: Simple Pagination

```jsx
---
// Define the `collection` prop.
const { collection } = Astro.props;

// Define a `createCollection` function.
export async function createCollection() {
  const allPosts = Astro.fetchContent('../posts/*.md'); // fetch local posts.
  allPosts.sort((a, b) => a.title.localeCompare(b.title)); // sort by title.
  return {
    // Because you are not doing anything more than simple pagination,
    // its fine to just return the full set of posts for the collection data.
    async data() { return allPosts; },
    // number of posts loaded per page (default: 25)
    pageSize: 10,
  };
}
---
<html lang="en">
  <head>
    <title>Pagination Example: Page Number {collection.page.current}</title>
  </head>
  <body>
    {collection.data.map((post) => (
      <h1>{post.title}</h1>
      <time>{formatDate(post.published_at)}</time>
      <a href={post.url}>Read Post</a>
    ))}
  </body>
</html>
```

## Example: Pagination Metadata

```jsx
---
// In addition to `collection.data` usage illustrated above, the `collection`
// prop also provides some important metadata for you to use, like: `collection.page`,
// `collection.url`, `collection.start`, `collection.end`, and `collection.total`.
// In this example, we'll use these values to do pagination in the template.
const { collection } = Astro.props;
export async function createCollection() { /* See Previous Example */ }
---
<html lang="en">
  <head>
    <title>Pagination Example: Page Number {collection.page.current}</title>
    <link rel="canonical" href={collection.url.current} />
    <link rel="prev" href={collection.url.prev} />
    <link rel="next" href={collection.url.next} />
  </head>
  <body>
    <main>
      <h5>Results {collection.start + 1}–{collection.end + 1} of {collection.total}</h5>
      {collection.data.map((post) => (
        <h1>{post.title}</h1>
        <time>{formatDate(post.published_at)}</time>
        <a href={post.url}>Read Post</a>
      ))}
    </main>
    <footer>
      <h4>Page {collection.page.current} / {collection.page.last}</h4>
      <nav class="nav">
        <a class="prev" href={collection.url.prev || '#'}>Prev</a>
        <a class="next" href={collection.url.next || '#'}>Next</a>
      </nav>
    </footer>
  </body>
</html>
```

## Example: Grouping Content by Tag, Author, etc.

```jsx
---
// Define the `collection` prop.
const { collection } = Astro.props;

// Define a `createCollection` function.
// In this example, we'll customize the URLs that we generate to
// create a new page to group every pokemon by first letter of their name.
export async function createCollection() {
  const allPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`);
  const allPokemonResult = await allPokemonResponse.json();
  const allPokemon = allPokemonResult.results;
  const allLetters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
  return {
    // `routes` defines the total collection of routes as `params` data objects.
    // In this example, we format each letter (ex: "a") to params (ex: {letter: "a"}).
    routes: allLetters.map(letter => {
      const params = {letter};
      return params;
    }),
    // `permalink` defines the final URL for each route object defined in `routes`.
    // It should always match the file location (ex: `src/pages/$pokemon.astro`).
    permalink: ({ params }) => `/pokemon/${params.letter}`,
    // `data` is now responsible for return the data for each page.
    // Luckily we had already loaded all of the data at the top of the function,
    // so we just filter the data here to group pages by first letter.
    // If you needed to fetch more data for each page, you can do that here as well.
    async data({ params }) {
      return allPokemon.filter((pokemon) => pokemon.name[0] === params.letter);
    },
    // Finally, `pageSize` and `pagination` is still on by default. Because
    // we don't want to paginate the already-grouped pages a second time, we'll
    // disable pagination.
    pageSize: Infinity,
  };
}
---
<html lang="en">
  <head>
    <title>Pokemon: {collection.params.letter}</head>
  <body>
    {collection.data.map((pokemon) => (<h1>{pokemon.name}</h1>))}
  </body>
</html>
```

## Example: Individual Pages from a Collection

**Note**: collection.data and .params are being fetched async, use optional chaining or some other way of handling this in template. Otherwise you will get build errors.

```jsx
---
// Define the `collection` prop.
const { collection } = Astro.props;

// Define a `createCollection` function.
// In this example, we'll create a new page for every single pokemon.
export async function createCollection() {
  const allPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`);
  const allPokemonResult = await allPokemonResponse.json();
  const allPokemon = allPokemonResult.results;
  return {
    // `routes` defines the total collection of routes as data objects.
    routes: allPokemon.map((pokemon, i) => {
      const params = {name: pokemon.name, index: i};
      return params;
    }),
    // `permalink` defines the final URL for each route object defined in `routes`.
    permalink: ({ params }) => `/pokemon/${params.name}`,
    // `data` is now responsible for return the data for each page.
    // Luckily we had already loaded all of the data at the top of the function,
    // so we just filter the data here to group pages by first letter.
    // If you needed to fetch more data for each page, you can do that here as well.
    // Note: data() is expected to return an array!
    async data({ params }) {
      return [allPokemon[params.index]];
    },
    // Note: The default pageSize is fine because technically only one data object
    // is ever returned per route. We set it to Infinity in this example for completeness.
    pageSize: Infinity,
  };
}
---
<html lang="en">
  <head>
    <title>Pokemon: {collection.params?.name}</title>
  </head>
  <body>
    Who's that pokemon? It's {collection.data[0]?.name}!
  </body>
</html>
```

## Tips

- If you find yourself duplicating markup across many pages and collections, you should probably be using more reusable components.

### 📚 Further Reading

- [Fetching data in Astro](/guides/data-fetching)
- API Reference: [collection](/reference/api-reference#collections-api)
- API Reference: [createCollection()](/reference/api-reference#createcollection)
- API Reference: [Creating an RSS feed](/reference/api-reference#rss-feed)
