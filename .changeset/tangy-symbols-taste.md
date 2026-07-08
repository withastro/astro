---
'astro': patch
---

Fixes `<ClientRouter />` script being silently dropped when slot content is consumed via string coercion (e.g. by `astro-capo`)

`SlotString.toString()` now includes script instruction content, so string concatenation on the result of `renderSlotToString()` no longer silently discards script tags.
