---
'astro': minor
---

ViewTransitions component renamed to ClientRouter

The `<ViewTransitions />` component has been renamed to `<ClientRouter />`. There are no other changes than the name. The old name will continue to work in Astro 5.x, but will be removed in 6.0.

This change was done to clarify the role of the component within Astro's View Transitions support. Astro supports View Transitions APIs in a few different ways, and renaming the component makes it more clear that the features you get from the ClientRouter component are slightly different from what you get using the native CSS-based MPA router.

We still intend to maintain the ClientRouter as before, and it's still important for use-cases that the native support doesn't cover, such as persisting state between pages.
