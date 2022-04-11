# @astrojs/netlify

## 0.2.0

### Minor Changes

- [`732ea388`](https://github.com/withastro/astro/commit/732ea3881e216f0e6de3642c549afd019d32409f) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Improve the Netlify adapter:

  1. Remove `site` config requirement
  2. Fix an issue where query params were being stripped
  3. Pass the event body to the request object

### Patch Changes

- [#2996](https://github.com/withastro/astro/pull/2996) [`77aa3a5c`](https://github.com/withastro/astro/commit/77aa3a5c504c5f51ed1c4d2c8abc4997397deec2) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add human-readable error when a site is not provided in your astro.config

* [#3011](https://github.com/withastro/astro/pull/3011) [`c6f8bce7`](https://github.com/withastro/astro/commit/c6f8bce7c35cc4fd450fe1b6cc8297a81e413b8e) Thanks [@matthewp](https://github.com/matthewp)! - Fixes dynamic routes in the Netlify adapter

## 0.1.1-beta.1

### Patch Changes

- [#3011](https://github.com/withastro/astro/pull/3011) [`c6f8bce7`](https://github.com/withastro/astro/commit/c6f8bce7c35cc4fd450fe1b6cc8297a81e413b8e) Thanks [@matthewp](https://github.com/matthewp)! - Fixes dynamic routes in the Netlify adapter

## 0.1.1-beta.0

### Patch Changes

- [#2996](https://github.com/withastro/astro/pull/2996) [`77aa3a5c`](https://github.com/withastro/astro/commit/77aa3a5c504c5f51ed1c4d2c8abc4997397deec2) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add human-readable error when a site is not provided in your astro.config

## 0.1.0

### Minor Changes

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update config options to resepect [RFC0019](https://github.com/withastro/rfcs/blob/main/proposals/0019-config-finalization.md)

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
