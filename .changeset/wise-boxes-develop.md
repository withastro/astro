---
'astro': minor
---

Exports a new `getActionPath()` helper from `astro:actions`

The `getActionPath()` utility accepts an action and returns a URL path so you can execute an action call as a `fetch()` operation directly. This allows you to provide details such as custom headers when you call your action.

This example shows how to call a defined `like` action passing the `Authorization` header and the [`keepalive`](https://developer.mozilla.org/en-US/docs/Web/API/Request/keepalive) option:

```astro
<script>
// src/components/my-component.astro
import { actions, getActionPath } from 'astro:actions'

await fetch(getActionPath(actions.like), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({ id: 'YOUR_ID' }),
  keepalive: true
})
</script>
```

This example shows how to call the same `like` action using the [`sendBeacon`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) API:

```astro
<script>
// src/components/my-component.astro
import { actions, getActionPath } from 'astro:actions'

navigator.sendBeacon(
  getActionPath(actions.like),
  new Blob([JSON.stringify({ id: 'YOUR_ID' })], {
    type: 'application/json'
  })
)
</script>
```
