---
'create-astro': minor
---

Removes "Open in x" badges from templates when they are used

Adds support for magic comments in template READMEs that wrap sections to remove when the template is used. This allows us to have content that is visible when the template is viewed in the repo, but not when the template is used.

Supported magic comments are:

`<!-- ASTRO:REMOVE:START -->` and `<!-- ASTRO:REMOVE:END -->`
