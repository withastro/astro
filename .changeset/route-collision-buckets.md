---
'astro': patch
---

Speeds up building the route list in projects with many pages by checking for route collisions only between routes that can collide, instead of between every pair of routes. The route list is rebuilt at startup and whenever a file in `src/` is added, removed, or changed in `astro dev`.
