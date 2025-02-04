---
'astro': patch
---

Adds extra guidance in the terminal when using the `astro add tailwind` CLI command

Now, users are given a friendly reminder to import the stylesheet containing their Tailwind classes into any pages  where they want to use Tailwind. Commonly, this is a shared layout component so that Tailwind styling can be used on multiple pages.
