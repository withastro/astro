---
'astro': patch
---

Fixes a bug where `<style>` tags from components could vanish from the build output when `await` expressions were used in the template/markup section of an `.astro` file
