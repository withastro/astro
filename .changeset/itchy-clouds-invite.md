---
"astro": minor
---

Removes the requirement for non-content files and assets inside content collections to be prefixed with an underscore. For files with extensions like `.astro` or `.css`, you can now remove underscores without seeing a warning in the terminal.

```diff
src/content/blog/
post.mdx
- _styles.css
- _Component.astro
+ styles.css
+ Component.astro
```

Continue to use underscores in your content collections to exclude individual content files, such as drafts, from the build output.
