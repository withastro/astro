---
"@astrojs/react": minor
"astro": minor
---

Changes the default behavior of `transition:persist` to update the props of persisted islands upon navigation. Also adds a new view transitions option `transition:persist-props` (default: `false`) to prevent props from updating as needed.

Islands which have the `transition:persist` property to keep their state when using the `<ViewTransitions />` router will now have their props updated upon navigation. This is useful in cases where the component relies on page-specific props, such as the current page title, which should update upon navigation.

For example, the component below is set to persist across navigation. This component receives a `products` props and might have some internal state, such as which filters are applied:

```astro
<ProductListing transition:persist products={products} />
```

Upon navigation, this component persists, but the desired `products` might change, for example if you are visiting a category of products, or you are performing a search.

Previously the props would not change on navigation, and your island would have to handle updating them externally, such as with API calls.

With this change the props are now updated, while still preserving state.

You can override this new default behavior on a per-component basis using `transition:persist-props=true` to persist both props and state during navigation:

```astro
<ProductListing transition:persist-props=true products={products} />
```
