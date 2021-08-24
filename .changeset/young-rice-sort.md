---
'astro': minor
---

**[BREAKING CHANGE]** stop bundling, building, and processing public files. This fixes an issue where we weren't actually honoring the "do not process" property of the public directory.

If you were using the `public/` directory as expected and not using it to build files for you, then this should not be a breaking change. However, will notice that these files are no longer bundled.

If you were using the `public/` directory to build files (for example, like `public/index.scss`) then you can expect this to no longer work. As per the correct Astro documentation.
