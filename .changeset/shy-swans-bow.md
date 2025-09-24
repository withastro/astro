---
'astro': minor
---

Warn on prerendered routes collision.

Previously, when two dynamic routes `/[foo]` and `/[bar]` returned values on their `getStaticPaths` that resulted in the same final path, only one of the routes would be rendered while the other would be silently ignored. Now, when this happens, a warning will be displayed explaining which routes collided and on which path.

Additionally, a new experimental flag `failOnPrerenderCollision` can be used to fail the build when such a collision occurs.
