---
'astro': patch
---

Adds `App.Providers` interface for typing custom context providers on `Astro` and `ctx`

```ts
declare namespace App {
  interface Providers {
    oauth: import('./lib/oauth').OAuthSession;
  }
}
```
