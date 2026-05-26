---
'astro': patch
---

Fixes scoped styles from `.astro` components being dropped when rendered inside MDX content (`<Content />` from `render(entry)`) passed through a named slot using `<Fragment slot="X">`. The Fragment component now eagerly evaluates its slot contents to ensure propagating components register their styles before head content is flushed.
