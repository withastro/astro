---
'astro': major
---

Updates the automatic `charset=utf-8` behavior for Markdown pages, where instead of responding with `charset=utf-8` in the `Content-Type` header, Astro will now automatically add the `<meta charset="utf-8">` tag instead.

This behaviour only applies to Markdown pages (`.md` or similar Markdown files located within `src/pages/`) that do not use Astro's special `layout` frontmatter property. It matches the rendering behaviour of other non-content pages, and retains the minimal boilerplate needed to write with non-ASCII characters when adding individual Markdown pages to your site.

If your Markdown pages use the `layout` frontmatter property, then HTML encoding will be handled by the designated layout component instead, and the `<meta charset="utf-8">` tag will not be added to your page by default.

If you require `charset=utf-8` to render your page correctly, make sure that your layout components contain the `<meta charset="utf-8">` tag. You may need to add this if you have not already done so.
