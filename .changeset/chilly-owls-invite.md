---
"@astrojs/node": minor
---

Added the `isIndependent: true` option to the `NodeJS` adapter. With this option, when building, the output folder `dist/server` will contain all the necessary data to start the server. And your server will be able to work without the `node_modules` folder
