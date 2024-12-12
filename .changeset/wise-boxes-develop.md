---
'astro': minor
---

Exports a new `getActionPath()` helper from `astro:actions`

In most cases, calling an action as `actions.like()` is enough. But sometimes it's not enough, for example:

- You want to pass custom headers
- You want to call the actions endpoint without `fetch`, eg. using the `navigator.sendBeacon` API

That's why you can now use the `getActionPath()` helper. Pass an action to it to get the pathname (prefixed by your `based` configuration) to the action:

```ts
import { actions, getActionPath } from 'astro:actions'

const path = getActionPath(actions.like) // '/_actions/like'
```

If you intent to use this server side, remember to supply a hostname (eg. using `Astro.site`).
