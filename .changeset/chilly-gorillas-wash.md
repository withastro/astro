---
'astro': patch
---

This includes the props passed to a hydration component when generating the hash/id. This prevents multiple instances of the same component with differing props to be treated as the same component when hydrated by Astro.
