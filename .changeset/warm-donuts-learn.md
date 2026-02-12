---
'astro': minor
---

Adds `streaming` option to the `createApp()` function exported from `astro/app/entrypoint`

`createApp()` allows adapters to create an `App` instance that works in development and in production.

It now accepts `streaming` (defaults to `true`) as an argument, forwarded to the `App` constructor:

```ts
import { createApp } from 'astro/app/entrypoint'

const app = createApp(false) // Streaming disabled
```
