---
'astro': patch
---

The route manifest was deserializing every route twice on startup. It only does it once now, so apps start a little faster, most noticeably on serverless cold starts with a lot of routes.
