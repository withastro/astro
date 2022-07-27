---
title: Referencing Vite Env Vars like import.meta.env.SITE, import.meta.env.TITLE and import.meta.env
layout: ../layouts/content.astro
---

## Referencing the full name of Vite env vars

You can get the configured site URL with `import.meta.env.SITE`.

The variable `import.meta.env.TITLE` is not configured.

You can reference all env vars through `import.meta.env`.

This should also work outside of code blocks:
- import.meta.env.SITE
- import.meta.env.TITLE
- import.meta.env

## Usage in fenced code blocks with syntax highlighting

```js
// src/pages/rss.xml.js
import rss from '@astrojs/rss';

export const get = () => rss({
	// Use Vite env vars with import.meta.env
	site: import.meta.env.SITE,
	title: import.meta.env.TITLE,
	items: import.meta.glob('./**/*.md'),
});
```

## Usage in frontmatter

> frontmatter.title: {frontmatter.title}
