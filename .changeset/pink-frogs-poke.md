---
'astro': minor
---

Adds a new `format` option to the [`paginate`](https://docs.astro.build/en/reference/routing-reference/#paginate) utility. The option `format` is a function that accepts the current URL of the page, and returns a new URL. 

For example, you can use `format` to append `.html`; useful for those websites where the URLs contain the `.html` extension.


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
