---
'create-astro': minor
---

Adds support for marking sections in template READMEs to be removed when the template is used

Template authors can use magic comments in template READMEs to mark sections that are removed when then templates are used by `create-astro`. 
This allows templates to have content that is visible when viewed in the repo, but not when the template is used. This is useful for things like 
"Open in x" badges that are not relevant when the template is used.

Supported magic comments are:

`<!-- ASTRO:REMOVE:START -->` and `<!-- ASTRO:REMOVE:END -->`
