---
'astro': patch
---

Fix MDX related head placement bugs

This fixes a variety of head content placement bugs (such as page `<link>`) related to MDX, especially when used in content collections. Issues fixed:

- Head content being placed in the body instead of the head.
- Head content missing when rendering an MDX component from within a nested Astro component.
