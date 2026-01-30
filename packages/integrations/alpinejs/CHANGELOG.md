# @astrojs/alpinejs

## 0.4.9

### Patch Changes

- [#14326](https://github.com/withastro/astro/pull/14326) [`c24a8f4`](https://github.com/withastro/astro/commit/c24a8f42a17410ea78fc2d68ff0105b931a381eb) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Updates `vite` version to fix CVE

## 0.4.8

### Patch Changes

- [#13731](https://github.com/withastro/astro/pull/13731) [`c3e80c2`](https://github.com/withastro/astro/commit/c3e80c25b90c803e2798b752583a8e77cdad3146) Thanks [@jsparkdev](https://github.com/jsparkdev)! - update vite to latest version for fixing CVE

## 0.4.7

### Patch Changes

- [#13591](https://github.com/withastro/astro/pull/13591) [`5dd2d3f`](https://github.com/withastro/astro/commit/5dd2d3fde8a138ed611dedf39ffa5dfeeed315f8) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Removes unused code

## 0.4.6

### Patch Changes

- [#13596](https://github.com/withastro/astro/pull/13596) [`3752519`](https://github.com/withastro/astro/commit/375251966d1b28a570bff45ff0fe7e7d2fe46f72) Thanks [@jsparkdev](https://github.com/jsparkdev)! - update vite to latest version to fix CVE

- [#13547](https://github.com/withastro/astro/pull/13547) [`360cb91`](https://github.com/withastro/astro/commit/360cb9199a4314f90825c5639ff4396760e9cfcc) Thanks [@jsparkdev](https://github.com/jsparkdev)! - Updates vite to the latest version

## 0.4.5

### Patch Changes

- [#13526](https://github.com/withastro/astro/pull/13526) [`ff9d69e`](https://github.com/withastro/astro/commit/ff9d69e3443c80059c54f6296d19f66bb068ead3) Thanks [@jsparkdev](https://github.com/jsparkdev)! - update `vite` to the latest version

## 0.4.4

### Patch Changes

- [#13505](https://github.com/withastro/astro/pull/13505) [`a98ae5b`](https://github.com/withastro/astro/commit/a98ae5b8f5c33900379012e9e253a755c0a8927e) Thanks [@ematipico](https://github.com/ematipico)! - Updates the dependency `vite` to the latest.

## 0.4.3

### Patch Changes

- [#13014](https://github.com/withastro/astro/pull/13014) [`820eee3`](https://github.com/withastro/astro/commit/820eee334b66e40d9e794daab04d0d1cf48f0185) Thanks [@jasonlav](https://github.com/jasonlav)! - Fixes an issue with user scripts running after `Alpine.start()`

## 0.4.2

### Patch Changes

- [#13011](https://github.com/withastro/astro/pull/13011) [`cf30880`](https://github.com/withastro/astro/commit/cf3088060d45227dcb48e041c4ed5e0081d71398) Thanks [@ascorbic](https://github.com/ascorbic)! - Upgrades Vite

## 0.4.1

### Patch Changes

- [#12799](https://github.com/withastro/astro/pull/12799) [`739dbfb`](https://github.com/withastro/astro/commit/739dbfba4214107cf8fc40c702834dad33eed3b0) Thanks [@ascorbic](https://github.com/ascorbic)! - Upgrades Vite to pin esbuild

## 0.4.0

### Minor Changes

- [#9751](https://github.com/withastro/astro/pull/9751) [`1153331cbbaa66a88645d15c6e949432210d4acc`](https://github.com/withastro/astro/commit/1153331cbbaa66a88645d15c6e949432210d4acc) Thanks [@florian-lefebvre](https://github.com/florian-lefebvre)! - Allows extending Alpine using the new `entrypoint` configuration

  You can extend Alpine by setting the `entrypoint` option to a root-relative import specifier (for example, `entrypoint: "/src/entrypoint"`).

  The default export of this file should be a function that accepts an Alpine instance prior to starting, allowing the use of custom directives, plugins and other customizations for advanced use cases.

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import alpine from '@astrojs/alpinejs';

  export default defineConfig({
    // ...
    integrations: [alpine({ entrypoint: '/src/entrypoint' })],
  });
  ```

  ```js
  // src/entrypoint.ts
  import type { Alpine } from 'alpinejs'

  export default (Alpine: Alpine) => {
      Alpine.directive('foo', el => {
          el.textContent = 'bar';
      })
  }
  ```

## 0.3.2

### Patch Changes

- [#9479](https://github.com/withastro/astro/pull/9479) [`1baf0b0d3cbd0564954c2366a7278794fad6726e`](https://github.com/withastro/astro/commit/1baf0b0d3cbd0564954c2366a7278794fad6726e) Thanks [@sarah11918](https://github.com/sarah11918)! - Updates README

## 0.3.1

### Patch Changes

- [#8737](https://github.com/withastro/astro/pull/8737) [`6f60da805`](https://github.com/withastro/astro/commit/6f60da805e0014bc50dd07bef972e91c73560c3c) Thanks [@ematipico](https://github.com/ematipico)! - Add provenance statement when publishing the library from CI

## 0.3.0

### Minor Changes

- [#8188](https://github.com/withastro/astro/pull/8188) [`d0679a666`](https://github.com/withastro/astro/commit/d0679a666f37da0fca396d42b9b32bbb25d29312) Thanks [@ematipico](https://github.com/ematipico)! - Remove support for Node 16. The lowest supported version by Astro and all integrations is now v18.14.1. As a reminder, Node 16 will be deprecated on the 11th September 2023.

- [#8179](https://github.com/withastro/astro/pull/8179) [`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7) Thanks [@matthewp](https://github.com/matthewp)! - Astro 3.0 Release Candidate

## 0.3.0-rc.1

### Minor Changes

- [#8179](https://github.com/withastro/astro/pull/8179) [`6011d52d3`](https://github.com/withastro/astro/commit/6011d52d38e43c3e3d52bc3bc41a60e36061b7b7) Thanks [@matthewp](https://github.com/matthewp)! - Astro 3.0 Release Candidate

## 0.3.0-beta.0

### Minor Changes

- [`1eae2e3f7`](https://github.com/withastro/astro/commit/1eae2e3f7d693c9dfe91c8ccfbe606d32bf2fb81) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 16. The lowest supported version by Astro and all integrations is now v18.14.1. As a reminder, Node 16 will be deprecated on the 11th September 2023.

## 0.2.2

### Patch Changes

- [#7104](https://github.com/withastro/astro/pull/7104) [`826e02890`](https://github.com/withastro/astro/commit/826e0289005f645b902375b98d5549c6a95ccafa) Thanks [@bluwy](https://github.com/bluwy)! - Specify `"files"` field to only publish necessary files

## 0.2.1

### Patch Changes

- [#6494](https://github.com/withastro/astro/pull/6494) [`a13e9d7e3`](https://github.com/withastro/astro/commit/a13e9d7e33baccf51e7d4815f99b481ad174bc57) Thanks [@Yan-Thomas](https://github.com/Yan-Thomas)! - Consistency improvements to several package descriptions

## 0.2.0

### Minor Changes

- [#6213](https://github.com/withastro/astro/pull/6213) [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updated compilation settings to disable downlevelling for Node 14

## 0.1.3

### Patch Changes

- [#5478](https://github.com/withastro/astro/pull/5478) [`1c7eef308`](https://github.com/withastro/astro/commit/1c7eef308e808aa5ed4662b53e67ec8d1b814d1f) Thanks [@nemo0](https://github.com/nemo0)! - Update READMEs for consistency

## 0.1.2

### Patch Changes

- [#4622](https://github.com/withastro/astro/pull/4622) [`63cd9d89e`](https://github.com/withastro/astro/commit/63cd9d89e8b83ce5e39cdae84a8342e28d1940cc) Thanks [@mohammed-elhaouari](https://github.com/mohammed-elhaouari)! - Update homepage link

## 0.1.1

### Patch Changes

- [#4501](https://github.com/withastro/astro/pull/4501) [`17e217856`](https://github.com/withastro/astro/commit/17e2178568d5a5a8134743bfb87c62f4c04979e5) Thanks [@mohammed-elhaouari](https://github.com/mohammed-elhaouari)! - add renderer category to alpinejs package keywords

## 0.1.0

### Minor Changes

- [#4406](https://github.com/withastro/astro/pull/4406) [`7310e8a17`](https://github.com/withastro/astro/commit/7310e8a1780dff2ffb57f8a6cfd3d021d019f6b8) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add new official Alpine.js integration
