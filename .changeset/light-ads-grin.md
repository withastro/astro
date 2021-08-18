---
'astro': minor
---

**[BREAKING]** Replace the Collections API with new file-based routing.

This is a breaking change which impacts collections, pagination, and RSS support.
Runtime warnings have been added to help you migrate old code to the new API.
If you have trouble upgrading, reach out on https://astro.build/chat

This change was made due to confusion around our Collection API, which many users found difficult to use. The new file-based routing approach should feel more familiar to anyone who has used Next.js or SvelteKit. 

Documentation added: 
- https://astro-docs-git-main-pikapkg.vercel.app/core-concepts/routing
- https://astro-docs-git-main-pikapkg.vercel.app/guides/pagination
- https://astro-docs-git-main-pikapkg.vercel.app/guides/rss
- https://astro-docs-git-main-pikapkg.vercel.app/reference/api-reference#getstaticpaths




