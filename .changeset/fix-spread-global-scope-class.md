---
"astro": patch
---

Fixes an issue where spreading an object containing a `class` property onto an HTML element would incorrectly add a scoped CSS class (e.g. `astro-j7pv25f6`) even when the component only uses `<style is:global>`. The extra class is now stripped when all styles in the component are global.
