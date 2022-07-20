---
'astro': minor
'@astrojs/markdown-component': minor
---

Move the Markdown component to its own package

This change moves the Markdown component into its own package where it will be maintained separately. All that needs to change from a user's perspective is the import statement:

```astro
---
import { Markdown } from 'astro/components';
---
```

Becomes:

```astro
---
import Markdown from '@astrojs/markdown-component';
---
```
