---
'astro': minor
---

Page Partials

A page component can now be identified as a **partial** page, which will render its HTML content without including a `<! DOCTYPE html>` declaration nor any `<head>` content.

A rendering library, like htmx or Stimulus or even just jQuery can access partial content on the client to dynamically update only parts of a page.

Pages marked as partials do not have a `doctype` or any head content included in the rendered result. You can mark any page as a partial by setting this option:


```astro
---
export const partial = true;
---

<li>This is a single list item.</li>
```

Other valid page files that can export a value (e.g. `.mdx`) can also be marked as partials.

Read more about [Astro page partials](/en/core-concepts/astro-pages/#partials) in our documentation.
