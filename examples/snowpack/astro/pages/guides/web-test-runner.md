---
layout: layouts/content.hmx
title: '@web/test-runner'
tags: communityGuide
img: '/img/logos/modern-web.svg'
imgBackground: '#f2f2f8'
description: How to use @web/test-runner in your Snowpack project.
---

[@web/test-runner](https://www.npmjs.com/package/@web/test-runner) is our recommended test runner for Snowpack projects. Read more about why we recommend @web/test-runner in our [Snowpack Testing Guide](/guides/testing).

To use [@web/test-runner](https://www.npmjs.com/package/@web/test-runner) in your project, [follow the instructions here](https://modern-web.dev/docs/test-runner/overview/) and make sure that you add the Snowpack plugin to your config file:

```js
// web-test-runner.config.js
module.exports = {
  plugins: [require('@snowpack/web-test-runner-plugin')()],
};
```

[See an example setup](https://github.com/snowpackjs/snowpack/blob/main/create-snowpack-app/app-template-react) in one of our Create Snowpack App starter templates.
