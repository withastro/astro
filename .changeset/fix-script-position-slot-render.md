---
'astro': patch
---

Fixes script position regression when rendered through `Astro.slots.render()`

Scripts in components rendered via `Astro.slots.render('default')` with `set:html` were being hoisted to the top of the slot output instead of rendering at their original position. This broke CSS `:first-child` selectors and sibling selectors. Scripts now use positional placeholders in the content stream to preserve their original location while maintaining deduplication behavior.
