---
'astro': patch
---

Fix `a11y-missing-content` dev toolbar audit reporting false positives for anchors inside `visibility: hidden` or `aria-hidden="true"` containers. Elements not rendered to the user or removed from the accessibility tree are now skipped.
