---
'create-astro': patch
---

Adds support for the [nub](https://nubjs.com) package manager. When `create-astro` is run through nub, the "next steps" output and processed template READMEs now print `nub run <script>` instead of an invalid `nub <script>` or a fallback to `npm run dev`.
