---
'astro': patch
---

Fixed a bug where Astro did not conform to JSX Expressions' [`&&`](https://reactjs.org/docs/conditional-rendering.html#inline-if-with-logical--operator) syntax.

Also fixed a bug where `<span data-attr="" />` would render as `<span data-attr="undefined" />`.
