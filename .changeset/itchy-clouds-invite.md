---
"astro": minor
---

Remove underscore prefix requirement for assets inside content collections. For colocated files like `.js` or `.css`, you can now remove underscores without raising a warning:

```diff
src/content/blog/
post.mdx
- _styles.css
- _Component.astro
+ styles.css
+ Component.astro
```
