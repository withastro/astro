---
'astro': patch
---

Fixed incorrect ARIA role classifications in the dev toolbar's accessibility audit: removed `alertdialog` and `application` from the non-interactive roles list, as they are widget (interactive) roles per the WAI-ARIA spec. Also fixed a trailing space in the `a11y-missing-attribute` error message.
