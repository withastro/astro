---
'astro': patch
---

Fix sync siblings inside `<Fragment>` being blocked from streaming when async children are present. Previously, `renderFragmentComponent` called `renderSlotToString` which eagerly awaited the entire slot into a string, preventing earlier sync content from flushing to the stream. It now uses `renderSlot` so Fragment children go through the same buffered async pipeline as all other elements.
