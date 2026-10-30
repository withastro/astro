---
'astro': patch
---

Fixes `import.meta.env` values containing `$` sequences (such as `$$` or `$&`) being corrupted in `astro build` when server code reads the `import.meta.env` object directly, for example with `const { MY_SECRET } = import.meta.env`
