---
'astro': patch
---

Speeds up content sync with `experimental.collectionStorage: "chunked"` by computing each character's UTF-8 width from its code point instead of encoding every character through `TextEncoder`. On a store of ~44k entries this cuts the chunking step from about 60 seconds to well under a second, with byte-identical output.
