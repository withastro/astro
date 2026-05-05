---
'astro': patch
---

Fixed issue where custome elements in MDX bypass the renderer pipline. By detecting hyphens in tag names within the JSX runtime, custom elements are now correctly routed to the renderer for SSR, ensuring parity with .astro files.
