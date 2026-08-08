---
'astro': patch
---

Fixes incremental builds never reusing a page when the fonts API is configured

During prerendering, the `virtual:astro:assets/fonts/runtime/font-file-url-resolver` module embeds the address of the font preview server, which listens on an ephemeral port. Its code therefore differed between two otherwise identical builds, changing the dependency hash of every route that uses fonts and making `experimental.incrementalBuild` re-render every page on every build.

That module is now marked volatile so it stays out of route dependency hashes. Font configuration continues to invalidate cached pages through the `virtual:astro:assets/fonts/internal` module.
