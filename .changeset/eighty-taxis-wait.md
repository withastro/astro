---
"astro": minor
---

Allow actions to be called on the server. This allows you to call actions as utility functions in your Astro frontmatter, endpoints, and server-side UI components.

Import and call directly from `astro:actions` as you would for client actions:

```astro
---
// src/pages/blog/[postId].astro
import { actions } from 'astro:actions';

await actions.like({ postId: Astro.params.postId });
---
```
