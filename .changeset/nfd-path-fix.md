---
'create-astro': patch
---

Fixes `create astro` silently scaffolding into the wrong directory on Linux when the project path contains non-ASCII characters. The tar extraction dependency normalizes paths to NFD (decomposed Unicode), which on byte-preserving filesystems such as ext4 creates a parallel decomposed-form directory tree while the CLI still reports success. Template files are now relocated back to the original NFC path after extraction.
