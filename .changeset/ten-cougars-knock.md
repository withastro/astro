---
'astro': patch
---

Support markdown draft pages. 
Markdown draft pages are markdown pages which have `draft` set in their frontmatter. By default, these will not be built by Astro while running `astro build`. To disable this behavior, you need to set `buildOptions.drafts` to `true` or pass the `--drafts` flag while running `astro build`. An exaple of a markdown draft page is:
```markdown
---
# src/pages/blog-post.md
title: My Blog Post
draft: true
---

This is my blog post which is currently incomplete.
```
