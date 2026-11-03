---
'astro': patch
---

Fixes `astro check` losing the end of its output, including the `Result` summary, when stdout is a pipe the reader drains slowly. The CLI now waits for stdout and stderr to flush before it exits.
