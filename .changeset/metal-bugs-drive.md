---
'@astrojs/markdoc': minor
'astro': patch
---

Remove the auto-generated `$entry` variable for Markdoc entries. To access frontmatter as a variable, you can pass `entry.data` as a prop where you render your content:

```astro
---
import { getEntry } from 'astro:content';

const entry = await getEntry('docs', 'why-markdoc');
const { Content } = await entry.render();
---

<Content frontmatter={entry.data} />
```
