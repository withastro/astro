---
'create-astro': patch
---

Ensure that isEmpty converts dirPath to a string before checking its existence, since a future version of Node.js will throw an error.
