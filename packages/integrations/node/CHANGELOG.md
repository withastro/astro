# @astrojs/node

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
