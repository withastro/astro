---
'astro': major
---

Updates Markdown page handling to no longer respond with `charset=utf-8` in the `Content-Type` header. This matches the rendering behaviour of other non-content pages.

Instead, for Markdown pages without layouts, Astro will automatically add the `<meta charset="utf-8">` tag to the page by default. This reduces the boilerplate needed to write with non-ASCII characters. If your Markdown pages have a layout, the layout component should include the `<meta charset="utf-8">` tag.

If you require `charset=utf-8` to render your page correctly, make sure that your layout components have the `<meta charset="utf-8">` tag added.
