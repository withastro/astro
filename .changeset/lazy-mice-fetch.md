---
'astro': patch
'@astrojs/markdoc': patch
---

Allow access to content collection entry information (including parsed frontmatter and the entry slug) from your Markdoc using the `$entry` variable:

```mdx
---
title: Hello Markdoc!
---

# {% $entry.data.title %}
```
