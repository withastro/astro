---
'astro': patch
---

Fixes `astro check` losing the end of its output, including the `Result` summary, when stdout is piped to a slow reader. When the reader closes the pipe early, for example `astro check | head`, `astro check` now exits with code 1 instead of crashing with an `EPIPE` stack trace.
