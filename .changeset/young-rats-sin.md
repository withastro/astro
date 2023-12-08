---
'astro': patch
---

Fixes an edge case with `astro add` that could install a prerelease instead of a stable release version. 

**Prior to this change**
`astro add svelte` installs `svelte@5.0.0-next.22`

**After this change**
`astro add svelte` installs `svelte@4.2.8`
