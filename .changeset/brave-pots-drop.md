---
'astro': minor
---

Page Partials

Any page component can now be identified as a *partial*, allowing you fetch them in the client in order to replace only parts of the page. Partials are used in conjuction with a rendering library, like htmx or Stimulus or even just jQuery.

Pages marked as partials do not have a `doctype` or any head content included in the rendered result. You can mark any page as a partial by setting this option:


```astro
---
export const partial = true;
---

<li>This is a single list item.</li>
```
