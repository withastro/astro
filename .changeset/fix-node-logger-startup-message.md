---
'@astrojs/node': patch
---

Fixes the `experimental.logger` destination not being used for the "Server listening on..." startup message. The custom logger is now resolved before the server starts listening, so the startup message uses the correct destination.
