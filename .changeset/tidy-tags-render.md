---
'astro': patch
---

Makes rendering of string tag names stricter and consistent across `.astro` dynamic tags, JSX, and MDX. Only the leading part of the string that is a valid element name is rendered, so characters such as `/` or `=` can no longer change the generated markup. A string that does not start with a valid element name (for example `'!--'` or `''`) now throws an error instead of producing invalid HTML.
