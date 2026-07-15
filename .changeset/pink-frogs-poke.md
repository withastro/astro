---
'astro': minor
---

Adds a new `format()` option to the [`paginate`](https://docs.astro.build/en/reference/routing-reference/#paginate) utility. The `format()` option is a function that accepts the current URL of the page, and returns a new URL. 

For example, when your host only supports URLs using the `.html` extension, you can use `format()` to add it to the generated URLs:


```astro
---
export async function getStaticPaths({ paginate }) {
  // Load your data with fetch(), getCollection(), etc.
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`);
  const result = await response.json();
  const allPokemon = result.results;

  // Return a paginated collection of paths for all items
  return paginate(allPokemon, { 
    pageSize: 10,
    format: (url) => `${url}.html` 
  });
}

const { page } = Astro.props;
---
```
