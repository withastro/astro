---
'@astrojs/node': patch
---

Move polyfills up before awaiting the env module in the Node.js adapter.

Previously the env setting was happening before the polyfills were applied. This means that if the Astro env code (or any dependencies) depended on `crypto`, it would not be polyfilled in time.

Polyfills should be applied ASAP to prevent races. This moves it to the top of the Node adapter.
