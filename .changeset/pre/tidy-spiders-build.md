---
'astro': minor
---

Allows integrations to control where Astro writes client, server, and prerender build output.

Custom prerenderers can access the final output locations through the new `outputDirectories` context:

```ts
setPrerenderer((defaultPrerenderer, { outputDirectories }) => {
  const { client, server, prerender } = outputDirectories

  return createPrerenderer({
    defaultPrerenderer,
    client,
    server,
    prerender,
  })
})
```
