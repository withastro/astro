---
'astro': patch
---

Fix missing production styles for Vue components rendered inside `client:only` Vue wrappers when the same child component is also used on another page with `client:load`
