---
'@astrojs/mdx': major
---

Handles the breaking change in Astro where content pages (including `.mdx` pages located within `src/pages/`) no longer respond with `charset=utf-8` in the `Content-Type` header.

For MDX pages without layouts, `@astrojs/mdx` will automatically add the `<meta charset="utf-8">` tag to the page by default. This reduces the boilerplate needed to write with non-ASCII characters. If your MDX pages have a layout, the layout component should include the `<meta charset="utf-8">` tag.

If you require `charset=utf-8` to render your page correctly, make sure that your layout components have the `<meta charset="utf-8">` tag added.
