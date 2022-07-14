---
layout: "../../layouts/BlogPost.astro"
title: "Hello static content!"
description: "Bring your markdown, we'll handle the rest"
publishDate: "11 Jul 2022"
heroImage:
  src: "/assets/blog/introducing-astro.jpg"
  alt: "Space shuttle leaving curved trail in the sky"
---

**Astro has built-in support for markdown pages!** All frontmatter data will be available [via `Astro.glob` imports](https://docs.astro.build/en/reference/api-reference/#astroglob) as well, making blog landing pages easy to build.

**Code challenge:** Try editing the `title` frontmatter property for this post and [visiting the homepage](/) again.

## Code block demo

```typescript
// Oh, and get Shiki syntax highlighting out-of-the-box!
// See our docs for customization options:
// https://docs.astro.build/en/guides/markdown-content/#syntax-highlighting
function getDistance(amount: number) {
  if (amount === Infinity) {
    return "and beyond!";
  } else {
    return "and the normal distance!";
  }
}
```
