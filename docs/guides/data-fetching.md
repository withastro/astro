---
layout: ~/layouts/Main.astro
title: Data Fetching
---

Astro support `fetch()` and "top-level await" to help you do remote data fetching inside of your page. See the ["Data Loading" Pages section](/docs/core-concepts/astro-pages.md#data-loading) for more info.

**Important:** These are not yet available inside of non-page Astro components. Instead, do all of your data loading inside of your pages, and then pass them to your components as props.

## Example

```astro
// Example: src/pages/foo.astro
// top-level `fetch()` and `await` are both supported natively in Astro (pages only).
const allPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`);
const allPokemonResult = await allPokemonResponse.json();
const allPokemon = allPokemonResult.results;
---
<html lang="en">
  <head>
    <title>Original 150 Pokemon</head>
  <body>
    {allPokemon.map((pokemon) => (<h1>{pokemon.name}</h1>))}
  </body>
</html>
```
