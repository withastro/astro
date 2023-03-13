---
'astro': patch
---

Fix various inaccuracies with types related to the new Assets features:

- getConfiguredImageService wasn't present on the astro:assets types.
- ImageMetadata wasn't exported
- Fixed wrong module declaration for `avif`, `heic` and `heif` files.
- Add missing module declaration for SVGs imports
