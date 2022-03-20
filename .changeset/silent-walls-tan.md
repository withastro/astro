---
'astro': patch
---

Fix island deduplication ignoring props.Re-resolves an issue initially patched in https://github.com/withastro/astro/pull/846 but seemingly lost in the 0.21.0 mega-merge (https://github.com/withastro/astro/commit/d84bfe719a546ad855640338d5ed49ad3aa4ccb4).This change makes the component render step account for all props, even if they don't affect the generated HTML, when deduplicating island mounts.
