---
'astro': major
---

Changes how styles of responsive images are emitted. The styles are now generated and inlined in a `<style>` tag of rendered page.

As a side effect, these styles will be rendered in pages that import `astro:assests` but don't use images.
