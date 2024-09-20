---
'astro': patch
---

Resolves image paths in content layer with initial slash as project-relative

When using the `image()` schema helper, previously paths with an initial slash were treated as public URLs. This was to match the behavior of markdown images. However this is a change from before, where paths with an initial slash were treated as project-relative. This change restores the previous behavior, so that paths with an initial slash are treated as project-relative.
