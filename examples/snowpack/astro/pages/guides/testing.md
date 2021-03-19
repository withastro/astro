---
layout: layouts/content.hmx
title: Testing
published: true
description: How to choose and use a JavaScript test runner for your Snowpack site.
---

Snowpack supports all of the popular JavaScript testing frameworks that you're already familiar with. Mocha, Jest, Jasmine, AVA and Cypress are all supported in Snowpack applications, if integrated correctly.

**We currently recommend [@web/test-runner](https://www.npmjs.com/package/@web/test-runner) (WTR) for testing in Snowpack projects.** When benchmarked, it performed faster than Jest (our previous recommendation) while also providing an environment for testing that more closely matches production. Most importantly, WTR runs the same Snowpack build pipeline that you've already configured for your project, so there's no second build configuration needed to run your tests. This improves test confidence while removing 100s of extra build dependencies to your project.

### Testing Guides

- [@web/test-runner](/guides/web-test-runner) (Recommended)
- [jest](/guides/jest)
