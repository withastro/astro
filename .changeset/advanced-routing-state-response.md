---
'astro': patch
---

Adds `FetchState.response` property, set automatically after `pages()` or `middleware()` completes

```ts
const response = await middleware(state, (s) => pages(s));
console.log(state.response === response); // true
```
