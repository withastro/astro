---
'@astrojs/solid-js-renderer': patch
'@astrojs/solid-js': patch
---

Fixes Solid islands that hydrate after another Solid island on the same page (e.g. `client:visible`, `client:idle`, `client:media`) replacing their server-rendered HTML instead of hydrating it, which discarded typed input and focus
