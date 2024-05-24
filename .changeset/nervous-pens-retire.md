---
"astro": patch
---

It's not possible anymore to use `Astro.rewrite("/404")` inside static pages. This isn't counterproductive because Astro will end-up emitting a page that contains the HTML of 404 error page.

It's still possible to use `Astro.rewrite("/404")` inside on-demand pages, or pages that opt-out from prerendering.
