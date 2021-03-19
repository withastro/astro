---
layout: layouts/content.hmx
title: 'Jest'
tags: communityGuide
img: '/img/logos/jest.svg'
imgBackground: '#d14c53'
published: true
description: How to use Jest, a popular test runner, with Snowpack.
---

[Jest](https://jestjs.io/) is a popular Node.js test runner for Node.js & web projects. Jest can be used with any frontend project as long as you configure how Jest should build your frontend files to run on Node.js. Many projects will try to manage this configuration for you, since it can get complicated.

Snowpack ships pre-built Jest configuration files for several popular frameworks. If you need to use Jest for any reason,consider extending one of these packages:

- React: [@snowpack/app-scripts-react](https://www.npmjs.com/package/@snowpack/app-scripts-react)
- Preact: [@snowpack/app-scripts-preact](https://www.npmjs.com/package/@snowpack/app-scripts-preact)
- Svelte: [@snowpack/app-scripts-svelte](https://www.npmjs.com/package/@snowpack/app-scripts-svelte)

Note: You will need a `jest.setup.js` file in the root directory of your project.

### Example

```js
// jest.config.js
// Example: extending a pre-built Jest configuration file
module.exports = {
  ...require('@snowpack/app-scripts-preact/jest.config.js')(),
};
```
