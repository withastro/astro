---
'astro': patch
---

Fixes component `<script>` tags being silently dropped when a slot's rendered output is consumed as a plain string by third-party head-management packages (for example `astro-capo`). Scripts produced via `renderSlotToString()` are now included in the string output as well as the internal render stream, so they are no longer lost outside Astro's own rendering pipeline. This restores `<ClientRouter />` link interception in projects that route slot content through such packages.
