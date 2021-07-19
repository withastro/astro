---
layout: ~/layouts/Main.astro
title: Collections
---

**Collections** are a special type of [Page](/core-concepts/astro-pages) that can generate multiple pages from a larger set of data. Example use-cases include:

- Automatic pagination: `/posts/1`, `/posts/2`, etc.
- Grouping content: `/author/fred`, `/author/matthew`, etc.
- Generating one page per item: `/pokemon/pikachu`, `/pokemon/charmander`, etc.
- Generating pages from remote data
- Generating pages from local data

**Use a Collection when you need to generate multiple pages from a single template.** If you just want to generate a single page (ex: a long list of every post on your site) then you can just fetch that data on a normal Astro page without using the Collection API.

## Using Collections

To create a new Astro Collection, you must do two things:

1. Create a new file in the `src/pages` directory that starts with the `$` symbol. This is required to enable the Collections API.

- Example: `src/pages/$tags.astro` -> `/tags/:tag`
- Example: `src/pages/$posts.astro` -> `/posts/1`, `/posts/2`, etc.

2. Define and export a `createCollection` function inside the component script. This exported function is where you tell Astro what pages to generate from the collection. It **MUST** be named `createCollection` and it must be exported. Check out the examples below for documentation on how it should be implemented.

- Example: `export async function createCollection() { /* ... */ }`
- API Reference: [createCollection](/reference/api-reference#collections-api)


## Example: Grouping Content by Tag, Author, etc.

```jsx
---
// Define a `createCollection` function.
// In this example, we'll customize the URLs that we generate to
// create a new page to group every pokemon by first letter of their name.
export async function createCollection() {
  const allPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`);
  const allPokemonResult = await allPokemonResponse.json();
  const allPokemon = allPokemonResult.results;
  const allLetters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
  return {
    // `route` defines the URL structure for your collection. 
    // Multiple URL params can be provided.
    route: `/pokemon/:letter`,
    // `paths` tells Astro which pages to generate in your collection.
    // Provide an array of params, matching the `route` pattern above.
    // Here, we create a route for each letter (ex: "a" -> {letter: "a"}).
    paths() {
      return allLetters.map(letter => ({params: {letter}}));
    },
    // `props` returns the data needed on each page.
    // If you needed to fetch more data for each page, you can do that here as well.
    // Luckily, we loaded all of the data that we need at the top of the function, 
    // so we use this function to pass the data to each page via the `items` prop.
    async props({ params }) {
      return {
        letter: params.letter,
        items: allPokemon.filter((pokemon) => pokemon.name[0] === params.letter)};
    },
  };
}
// Every page is now passed props, returned from the `props()` function above. 
const {letter, items} = Astro.props;
---
<html lang="en">
  <head>
    <title>Pokemon: {params.letter}</head>
  <body>
    {items.map((pokemon) => (<h1>{pokemon.name}</h1>))}
  </body>
</html>
```

## Example: Individual Pages from Remote Data

```jsx
---
// Define a `createCollection` function.
// In this example, we'll create a new page for every single pokemon.
export async function createCollection() {
  const allPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`);
  const allPokemonResult = await allPokemonResponse.json();
  const allPokemon = allPokemonResult.results;
  return {
    // `route` defines the URL structure for your collection. 
    // Multiple URL params can be provided.
    route: `/pokemon/:number`,
    // `paths` tells Astro which pages to generate in your collection.
    // Provide an array of params, matching the `route` pattern above.
    paths() {
      return allPokemon.map((pokemon, i) => ({params: {number: i}}));
    },
    // `props` returns the data needed on each page.
    // If you needed to fetch more data for each page, you can do that here as well.
    // Luckily, we loaded all of the data that we need at the top of the function, 
    // so we use this function to pass the data to each page via the `items` prop.
    async props({ params }) {
      return {item: allPokemon[params.number]};
    },
  };
}
// For each page, "item" is the pokemon for that page.
const {item} = Astro.props;
---
<html lang="en">
  <head>
    <title>Pokemon: {item.name}</head>
  <body>
    Who's that pokemon? It's {item.name}!
  </body>
</html>
```


## Example: Simple Pagination

```jsx
---
// Define a `createCollection` function.
export async function createCollection() {
  const allPosts = Astro.fetchContent('../posts/*.md'); // fetch local posts.
  allPosts.sort((a, b) => a.title.localeCompare(b.title)); // sort by title.
      
  return {
    // Set "paginate" to true to enable pagination.
    paginate: true,
    // A paginated collection must include a ":page?" optional page param.
    route: '/posts/:page?',
    // `paths()` - not needed if `:page` is your only route param.
    // If you define additional params in your route, then
    // you will need a paths() function.
    // `props()` - notice the new `paginate()` argument! We will use that
    // to enable pagination on a certain prop. In this example, "posts"
    // will become a paginated data object and multiple pages will be
    // generated based on the given page size.
    async props({paginate}) { 
      return {
        posts: paginate(allPosts, {pageSize: 10}),
      }; 
    },
  };
}
// Now, you can get the paginated posts from your props.
const {posts} = Astro.props;
---
<html lang="en">
  <head>
    <title>Pagination Example</title>
  </head>
  <body>
    {posts.data.map((post) => (
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
// In addition to data, your paginated prop also includes important metadata
// for the collection, such as: `collection.page` and `collection.url`.
// In this example, we'll use these values to add pagination UI controls.
export async function createCollection() { /* See Previous Example */ }
const {posts} = Astro.props;
---
<html lang="en">
  <head>
    <title>Pagination Example: Page Number {posts.page.current}</title>
    <link rel="canonical" href={posts.url.current} />
    <link rel="prev" href={posts.url.prev} />
    <link rel="next" href={posts.url.next} />
  </head>
  <body>
    <main>
      <h5>Results {posts.start + 1}–{posts.end + 1} of {posts.total}</h5>
    </main>
    <footer>
      <h4>Page {posts.page.current} / {posts.page.last}</h4>
      <nav class="nav">
        <a class="prev" href={posts.url.prev || '#'}>Prev</a>
        <a class="next" href={posts.url.next || '#'}>Next</a>
      </nav>
    </footer>
  </body>
</html>
```

### 📚 Further Reading

- [Fetching data in Astro](/guides/data-fetching)
- API Reference: [collection](/reference/api-reference#collections-api)
- API Reference: [createCollection()](/reference/api-reference#createcollection)
- API Reference: [Creating an RSS feed](/reference/api-reference#rss-feed)
