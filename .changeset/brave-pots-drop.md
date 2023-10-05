---
'astro': minor
---

Page Fragments

Any page components can now be identified as *fragments*, allowing you fetch them in the client in order to replace only parts of the page. Fragments are used in conjuction with a partial rendering library, like htmx or Stimulus or even just jQuery.

Pages marked as fragments do not have a `doctype` or any head content included in the rendered result. You can mark any page as a fragment by setting this option:


```astro
---
export const fragment = true;
---

<li>This is a single list item.</li>
```
