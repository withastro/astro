---
'astro': minor
---

Return raw `html` when calling `render()` on a markdown content.

```astro
---
const entry = await getEntryBySlug('blog', 'my-first-post');
const { html } = await entry.render();
---

<div set:html={html}></div>
```
