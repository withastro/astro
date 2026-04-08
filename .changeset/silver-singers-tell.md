---
'astro': patch
---

Revives UnoCSS in dev mode when used with the client router.

This change partly reverts [#16089](https://github.com/withastro/astro/pull/16089), which in hindsight turned out to be too general. Instead of automatically persisting all style sheets, we now do this only for styles from Vue components.

