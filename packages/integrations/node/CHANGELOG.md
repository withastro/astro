# @astrojs/node

## 0.1.5

### Patch Changes

- [#3865](https://github.com/withastro/astro/pull/3865) [`1f9e4857`](https://github.com/withastro/astro/commit/1f9e4857ff2b2cb7db89d619618cdf546cd3b3dc) Thanks [@delucis](https://github.com/delucis)! - Small README fixes

* [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.1.4

### Patch Changes

- [#3817](https://github.com/withastro/astro/pull/3817) [`2f56664f`](https://github.com/withastro/astro/commit/2f56664f85596c6268ecb44bbb9c36cca2ea49c5) Thanks [@ran-dall](https://github.com/ran-dall)! - Fix example on `README.md`

## 0.1.3

### Patch Changes

- [#3677](https://github.com/withastro/astro/pull/3677) [`8045c8ad`](https://github.com/withastro/astro/commit/8045c8ade16fe4306448b7f98a4560ef0557d378) Thanks [@Jutanium](https://github.com/Jutanium)! - Update READMEs

## 0.1.2

### Patch Changes

- Updated dependencies [[`4de53ecc`](https://github.com/withastro/astro/commit/4de53eccef346bed843b491b7ab93987d7d85655)]:
  - @astrojs/webapi@0.12.0

## 0.1.1

### Patch Changes

- [`815d62f1`](https://github.com/withastro/astro/commit/815d62f151a36fef7d09590d4962ca71bda61b32) Thanks [@FredKSchott](https://github.com/FredKSchott)! - no changes.

## 0.1.0

### Minor Changes

- [#2979](https://github.com/withastro/astro/pull/2979) [`9d7a4b59`](https://github.com/withastro/astro/commit/9d7a4b59b53f8cb274266f5036d1cef841750252) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Welcome to the Astro v1.0.0 Beta! Read the [official announcement](https://astro.build/blog/astro-1-beta-release/) for more details.

## 0.0.2

### Patch Changes

- [#2879](https://github.com/withastro/astro/pull/2879) [`80034c6c`](https://github.com/withastro/astro/commit/80034c6cbc89761618847e6df43fd49560a05aa9) Thanks [@matthewp](https://github.com/matthewp)! - Netlify Adapter

  This change adds a Netlify adapter that uses Netlify Functions. You can use it like so:

  ```js
  import { defineConfig } from 'astro/config';
  import netlify from '@astrojs/netlify/functions';

  export default defineConfig({
    adapter: netlify(),
  });
  ```

* [#2873](https://github.com/withastro/astro/pull/2873) [`e4025d1f`](https://github.com/withastro/astro/commit/e4025d1f530310d6ab951109f4f53878a307471a) Thanks [@matthewp](https://github.com/matthewp)! - Improves the build by building to a single file for rendering

## 0.0.2-next.0

### Patch Changes

- [#2873](https://github.com/withastro/astro/pull/2873) [`e4025d1f`](https://github.com/withastro/astro/commit/e4025d1f530310d6ab951109f4f53878a307471a) Thanks [@matthewp](https://github.com/matthewp)! - Improves the build by building to a single file for rendering
