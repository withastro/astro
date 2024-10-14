---
'astro': patch
---

Fixes a false positive reported by the dev toolbar Audit app where a label was considered missing when associated with a button

The `button` element can be [used with a label](https://www.w3.org/TR/2011/WD-html5-author-20110809/forms.html#category-label) (e.g. to create a switch) and should not be reported as an accessibility issue when used as a child of a `label`.
