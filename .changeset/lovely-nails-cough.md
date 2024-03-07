---
"@astrojs/react": minor
"astro": minor
---

Changes the default behavior of `transition:persist` to update the props of persisted islands upon navigation. Also adds a new view transitions option `transition:persist-props` (default: `false`) to prevent props from updating as needed.

Islands which have the `transition:persist` property to keep state in `<ViewTransitions />` will now have their props updated upon navigation. For example, if you have a component:

```astro
<ProductListing transition:persist products={products} />
```

This component might have some internal state, such as which filters are applied. Upon navigation, this component persists, but the underlying `products` might change, for example if you are visiting a category of products, or you are performing a search.

Previously the props will not change on navigation, and your island would have to handle updating them externally, such as with API calls.

With this change the props are now updated, while still preserving state.
