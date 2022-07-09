# @astrojs/sitemap

## 0.2.5

### Patch Changes

- [#3865](https://github.com/withastro/astro/pull/3865) [`1f9e4857`](https://github.com/withastro/astro/commit/1f9e4857ff2b2cb7db89d619618cdf546cd3b3dc) Thanks [@delucis](https://github.com/delucis)! - Small README fixes

* [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.2.4

### Patch Changes

- [#3677](https://github.com/withastro/astro/pull/3677) [`8045c8ad`](https://github.com/withastro/astro/commit/8045c8ade16fe4306448b7f98a4560ef0557d378) Thanks [@Jutanium](https://github.com/Jutanium)! - Update READMEs

## 0.2.3

### Patch Changes

- [#3723](https://github.com/withastro/astro/pull/3723) [`52f75369`](https://github.com/withastro/astro/commit/52f75369efe5a0a1b320478984c90b6727d52159) Thanks [@alextim](https://github.com/alextim)! - fix: if `serialize` function returns `undefined` for the passed entry, such entry will be excluded from sitemap

## 0.2.2

### Patch Changes

- [#3689](https://github.com/withastro/astro/pull/3689) [`3f8ee70e`](https://github.com/withastro/astro/commit/3f8ee70e2bc5b49c65a0444d9606232dadbc2fca) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add warning log for sitemap + SSR adapter, with suggestion to use customPages configuration option

## 0.2.1

### Patch Changes

- [#3661](https://github.com/withastro/astro/pull/3661) [`2ff11df4`](https://github.com/withastro/astro/commit/2ff11df438a6a901e72d1f1979c79deb0ad199f2) Thanks [@matthewp](https://github.com/matthewp)! - Fixes the last build

## 0.2.0

### Minor Changes

- [#3579](https://github.com/withastro/astro/pull/3579) [`1031c06f`](https://github.com/withastro/astro/commit/1031c06f9c6794d9ee6fb18c145ca5614e6f0583) Thanks [@alextim](https://github.com/alextim)! - # Key features

  - Split up your large sitemap into multiple sitemaps by custom limit.
  - Ability to add sitemap specific attributes such as `lastmod` etc.
  - Final output customization via JS function.
  - Localization support.
  - Reliability: all config options are validated.

  ## Important changes

  The integration always generates at least two files instead of one:

  - `sitemap-index.xml` - index file;
  - `sitemap-{i}.xml` - actual sitemap.

## 0.1.2

### Patch Changes

- [#3563](https://github.com/withastro/astro/pull/3563) [`09803129`](https://github.com/withastro/astro/commit/098031294f4e25619d0ae5a6ffc871c7401d98ae) Thanks [@alextim](https://github.com/alextim)! - Remove unused dependency

## 0.1.1

### Patch Changes

- [#3553](https://github.com/withastro/astro/pull/3553) [`c601ce59`](https://github.com/withastro/astro/commit/c601ce59b5740e7ff48c6575a6168d6a2408f7a3) Thanks [@caioferrarezi](https://github.com/caioferrarezi)! - Prevent sitemap URLs with trimmed paths

## 0.1.0

### Minor Changes

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update config options to resepect [RFC0019](https://github.com/withastro/rfcs/blob/main/proposals/0019-config-finalization.md)

### Patch Changes

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add new sitemap configuration options:
  - `filter`: filter pages to include in your sitemap
  - `canonicalURL`: override your astro.config `site` with a custom base URL

## 0.0.2

### Patch Changes

- [#2885](https://github.com/withastro/astro/pull/2885) [`6b004363`](https://github.com/withastro/astro/commit/6b004363f99f27e581d1e2d53a2ebff39d7afb8a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add README across Astro built-in integrations

* [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site

## 0.0.2-next.0

### Patch Changes

- [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site
