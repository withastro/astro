---
"astro": patch
---

Fixes a regression where a `<script>` containing an external dynamic import (e.g. `import('/external.js')`) was inlined into the HTML with an unreplaced `__VITE_PRELOAD__` marker, causing a `ReferenceError` at runtime. Such scripts are now kept as standalone bundle entries so Vite can process the marker.
