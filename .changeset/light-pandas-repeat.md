---
'astro': patch
---

Fixes a bug where editing a content collection entry during `astro dev` on Windows kept serving stale content until the dev server was restarted. The data store now notifies the dev server directly after each write instead of relying only on the file watcher, which can miss the atomic rename that commits the write on some platforms.
