---
'astro': patch
---

Fix edge case where `<style>` updates inside of `.astro` files would ocassionally fail to update without reloading the page.
