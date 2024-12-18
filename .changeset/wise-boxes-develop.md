---
'astro': minor
---

Adds a new `getActionPath()` helper available from `astro:actions`

Astro 5.1 introduces a new helper function, `getActionPath()` to give you more flexibility when calling your action.

Calling `getActionPath()` with your action returns its URL path so you can make a `fetch()` request with custom headers, or use your action with an API such as `navigator.sendBeacon()`. Then, you can [handle the custom-formatted returned data](https://docs.astro.build/en/guides/actions/#handling-returned-data) as needed, just as if you had called an action directly.

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
