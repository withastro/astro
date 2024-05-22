# @astrojs/web-vitals

## 0.2.0

### Minor Changes

- [#11094](https://github.com/withastro/astro/pull/11094) [`3c7a4fa`](https://github.com/withastro/astro/commit/3c7a4fabea5ebb0e8f79742731415136ae3da9a6) Thanks [@delucis](https://github.com/delucis)! - Upgrades the `web-vitals` dependency to v4 and stops collecting data for the deprecated FID (First Input Delay) metric.

### Patch Changes

- [#11096](https://github.com/withastro/astro/pull/11096) [`0dbd8ee`](https://github.com/withastro/astro/commit/0dbd8eeb77065f3ed03f481c8042f2896a5448c4) Thanks [@delucis](https://github.com/delucis)! - Adds support for deprecating the web vitals DB table, so the integration can be removed if desired

## 0.1.1

### Patch Changes

- [#10947](https://github.com/withastro/astro/pull/10947) [`e63e96b`](https://github.com/withastro/astro/commit/e63e96bf32bce270926da6e65c9a331cf9e462d4) Thanks [@delucis](https://github.com/delucis)! - Fixes a runtime issue where Vite was unintentionally pulled into the server code

## 0.1.0

### Minor Changes

- [#10883](https://github.com/withastro/astro/pull/10883) [`a37d76a`](https://github.com/withastro/astro/commit/a37d76a42ac00697be3acd575f3f7163129ea75c) Thanks [@delucis](https://github.com/delucis)! - Adds a new web-vitals integration powered by Astro DB
