---
'create-astro': patch
---

Fixes `create-astro` silently writing template files to the wrong directory on Linux when the path contains non-ASCII characters (e.g., Turkish `ü`). Updates `@bluwy/giget-core` to pick up the upstream fix in `modern-tar` v0.7.7 for Unicode NFC/NFD path normalization.
