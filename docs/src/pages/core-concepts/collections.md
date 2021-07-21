---
layout: ~/layouts/Main.astro
title: Collections
---

**Collections** are a special type of [page](/core-concepts/astro-pages) in Astro that can generate multiple pages at different URLs for a larger set of data. If you've seen an Astro file that starts with a dollar sign (ex: `$posts.astro`), that's a collection.

Example use-cases include:

- Generating multiple pages from remote data
- Generating multiple pages from local data (ex: list all markdown posts)
- pagination: `/posts/1`, `/posts/2`, etc.
- Grouping items into multiple pages: `/author/fred`, `/author/matthew`, etc.
- Generating one page per item: `/pokemon/pikachu`, `/pokemon/charmander`, etc.

**Use a Collection when you need to generate multiple pages from a single template.** If you just want to generate a single page -- like a long list linking to every post on your blog -- then you can just use a normal [page](/core-concepts/astro-pages).

## Using Collections

To create a new Astro Collection, you need to do two things:

### 1. Create the File

Create a new file in the `src/pages` directory that starts with the dollar sign (`$`) symbol. This symbol is required to enable the Collections API.

Astro uses file-based routing, which means that the file must match the URL that you expect to generate. You are able to define a custom route structure in the next step, but the collection file name must always match the start of the URL.

- **Example**: `src/pages/$tags.astro` -> `/tags/:tag`
- **Example**: `src/pages/$posts.astro` -> `/posts/1`, `/posts/2`, etc.

### 2. Export createCollection

Every collection must define and export a `createCollection` function inside the component script. This exported function is where you fetch your data for the entire collection and tell Astro the exact URLs that you'd like to generate. It **MUST** be named `createCollection` and it must be exported. Check out the examples below for examples of how this should be implemented.

```astro
---
export async function createCollection() { 
  /* fetch collection data here */
  return { /* see examples below */ };
}
---
<!-- Not shown: Page HTML template -->
```

API Reference: [createCollection](/reference/api-reference#collections-api)

## Example: Individual Pages

One of the most common reasons to use a collection is to generate a page for every item fetched from a larger dataset. In this example, we'll query a remote API and use the result to generate 150 different pages: one for each pokemon returned by the API call.

Run this example in development, and then visit [http://localhost:3000/pokemon/pikachu](http://localhost:3000/pokemon/pikachu) to see one of the generated pages.

```jsx
---
// Example: src/pages/$pokemon.astro
// Define a `createCollection` function.
// In this example, we'll create a new page for every single pokemon.
export async function createCollection() {
  // Do your data fetching here.
  const allPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`);
  const allPokemonResult = await allPokemonResponse.json();
  const allPokemon = allPokemonResult.results;
  return {
    // `route` defines the URL structure for your collection. 
    // You can use any URL path pattern here, as long as it 
    // matches the filename prefix (`$pokemon.astro` -> `/pokemon/*`).
    route: `/pokemon/:name`,
    // `paths` tells Astro which pages to generate in your collection.
    // Provide an array of `params` objects that match the `route` pattern.
    paths() {
      return allPokemon.map((pokemon, i) => ({params: {name: pokemon.name}}));
    },
    // For each individual page, return the data needed on each page.
    // If you needed to fetch more data for each page, you can do that here as well.
    // Luckily, we loaded all of the data that we need at the top of the function.
    async props({ params }) {
      return {item: allPokemon.find((pokemon) => pokemon.name === params.name)};
    },
  };
}
// The rest of your component script now runs on each individual page. 
// "item" is one of the props returned in the `props()` function.
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

## Example: Grouping Content by Page

You can also group items by page. In this example, we'll fetch data from the same Pokemon API. But instead of generating 150 pages, we'll just generate one page for every letter of the alphabet, creating an alphabetical index of Pokemon.

*Note: Looking for pagination? Collections have built-in support to make pagination easy. Be sure to check out the next example.*

```jsx
---
// Define a `createCollection` function.
export async function createCollection() {
  // Do your data fetching here.
  const allPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`);
  const allPokemonResult = await allPokemonResponse.json();
  const allPokemon = allPokemonResult.results;
  const allLetters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
  return {
    // `route` defines the URL structure for your collection. 
    // You can use any URL path pattern here, as long as it 
    // matches the filename prefix (`$pokemon.astro` -> `/pokemon/*`).
    route: `/pokemon/:letter`,
    // `paths` tells Astro which pages to generate in your collection.
    // Provide an array of `params` objects that match the `route` pattern.
    // Here, we create a route for each letter (ex: "a" -> {letter: "a"}).
    paths() {
      return allLetters.map(letter => ({params: {letter}}));
    },
    // `props` returns the data needed on each page.
    // For each individual page, return the data needed on each page.
    // If you needed to fetch more data for each page, you can do that here as well.
    // Luckily, we loaded all of the data that we need at the top of the function.
    async props({ params }) {
      return {
        letter: params.letter,
        items: allPokemon.filter((pokemon) => pokemon.name[0] === params.letter)};
    },
  };
}
// The rest of your component script now runs on each individual page. 
// "item" is one of the props returned in the `props()` function.
const {letter, items} = Astro.props;
---
<html lang="en">
  <head>
    <title>Page: {letter}</head>
  <body>
    {items.map((pokemon) => (<h1>{pokemon.name}</h1>))}
  </body>
</html>
```

## Example: Pagination

Pagination is a common use-case for static websites. Astro has built-in pagination support that was designed to make pagination effortless. Just pass `paginate: true` in the `createCollection` return object to enable automatic pagination.

This example provides a basic implementation of pagination. In the previous examples, we had fetched from a remote API. In this example, we'll fetch our local markdown files to create a paginated list of all posts for a blog.

```jsx
---
// Define a `createCollection` function.
export async function createCollection() {
  const allPosts = Astro.fetchContent('../posts/*.md') // fetch local posts...
    .sort((a, b) => a.title.localeCompare(b.title)); // ... and sort by title.
      
  return {
    // Set "paginate" to true to enable pagination.
    paginate: true,
    // Remember to add the ":page?" param for pagination.
    // The "?" indicates an optional param, since the first page does not use it.
    // Example: `/posts`, `/posts/2`, `/posts/3`, etc.
    route: '/posts/:page?',
    // `paths()` - not needed if `:page?` is your only route param.
    // If you define have other params in your route, then you will still
    // need a paths() function similar to the examples above.
    //
    // `props()` - notice the new `{paginate}` argument! This is passed to
    // the props() function when `paginate` is set to true. We can now use
    // it to enable pagination on a certain prop. In this example, we paginate
    // "posts" so that multiple pages will be generated based on the given page size.
    async props({paginate}) { 
      return {
        posts: paginate(allPosts, {pageSize: 10}),
      }; 
    },
  };
}
// Now, you can get the paginated posts from your props.
// Note that a paginated prop is a custom object format, where the data
// for the page is available at `posts.data`. See the next example to
// learn how to use the other properties of this object.
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

Building on the example above: when you use the `paginate` API you get access to several other properties in the paginated data prop. Your paginated prop includes important metadata
for the collection, such as: `.page` for keeping track of your page number and `.url` for linking to other pages in the collection.

In this example, we'll use these values to add pagination UI controls to your HTML template.

```jsx
---
export async function createCollection() { /* See Previous Example */ }
// Remember that a paginated prop uses a custom object format to help with pagination.
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

## RSS Feeds

You can generate an RSS 2.0 feed from the `createCollection()` result by adding the `rss` option. Here are all the options:

```jsx
export async function createCollection() {
  return {
    paginate: true,
    route: '/posts/:page?',
    async props({paginate}) { /* Not shown: see examples above */ },
    rss: {
      title: 'My RSS Feed',
      description: 'Description of the feed',
      // (optional) add xmlns:* properties to root element
      xmlns: {
        itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
        content: 'http://purl.org/rss/1.0/modules/content/',
      },
      // (optional) add arbitrary XML to <channel>
      customData: `<language>en-us</language>
<itunes:author>The Sunset Explorers</itunes:author>`,
      // Format each paginated item in the collection
      item: (item) => ({
        title: item.title,
        description: item.description,
        // enforce GMT timezone (otherwise it’ll be different based on where it’s built)
        pubDate: item.pubDate + 'Z', 
        // custom data is supported here as well
      }),
    },
  };
}
```

Astro will generate your RSS feed at the URL `/feed/[collection].xml`. For example, `/src/pages/$podcast.astro` would generate URL `/feed/podcast.xml`.

Even though Astro will create the RSS feed for you, you’ll still need to add `<link>` tags manually in your `<head>` HTML for feed readers and browsers to pick up:

```html
<link rel="alternate" type="application/rss+xml" title="My RSS Feed" href="/feed/podcast.xml" />
```
### 📚 Further Reading

- [Fetching data in Astro](/guides/data-fetching)
- API Reference: [createCollection()](/reference/api-reference#createcollection)
- API Reference: [createCollection() > Pagination](/reference/api-reference#pagination)
- API Reference: [createCollection() > RSS](/reference/api-reference#rss)
