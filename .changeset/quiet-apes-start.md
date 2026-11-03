---
'astro': patch
---

Fixes `astro check` losing the end of its output, including the `Result` summary, when stdout is piped to a slow reader. It also no longer crashes with an `EPIPE` error when the reader closes the pipe early, for example `astro check | head`.
