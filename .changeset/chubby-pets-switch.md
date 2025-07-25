---
'astro': patch
---

Fixes a bug that prevented Zod 4 from being installed in an Astro site

You can now install and use your own version of Zod 4 in an Astro site, and Astro will continue to use its own version of Zod for its own APIs. This is particularly useful where you have dependencies that require Zod 4.

> [!NOTE]
> You should not attempt to use Zod 4 for for Astro APIs such as content collections or actions. You should use the `astro/zod`, `astro:content`, or `astro:schema` imports instead, which will always use the version of Zod that Astro is using. 
