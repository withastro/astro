---
'@astrojs/node': patch
'astro': patch
---

Fixes the `experimental.logger` destination not being used for the "Server listening on..." startup message. The logger is now resolved before the server starts listening, and `adapterLogger` re-creates itself when the underlying logger changes so the startup message uses the correct destination.
