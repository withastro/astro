---
'astro': minor
---

Adds a new property `routePattern` available to `GetStaticPathsOptions`

This provides the original, dynamic segment definition in a routing file path (e.g. `/[...locale]/[files]/[slug]`) from the Astro render context that would not otherwise be available within the scope of `getStaticPaths()`. This can be useful to calculate the `params` and `props` for each page route.

For example, you can now localize your route segments and return an array of static paths by passing `routePattern` to a custom `getLocalizedData()` helper function. The `params` object will be set with explicit values for each route segment (e.g. `locale`, `files`, and `slug)`. Then, these values will be used to generate the routes and can be used in your page template via `Astro.params`.


```astro
// src/pages/[...locale]/[files]/[slug].astro
---
import { getLocalizedData } from "../../../utils/i18n";
export async function getStaticPaths({ routePattern }) {
  const response = await fetch('...');
  const data = await response.json();
  console.log(routePattern); // [...locale]/[files]/[slug]
  // Call your custom helper with `routePattern` to generate the static paths
  return data.flatMap((file) => getLocalizedData(file, routePattern));
}
const { locale, files, slug } = Astro.params;
---
```

For more information about this advanced routing pattern, see Astro's [routing reference](https://docs.astro.build/en/reference/routing-reference/#routepattern).
