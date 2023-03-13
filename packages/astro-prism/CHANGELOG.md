# @astrojs/prism

## 2.1.1

### Patch Changes

- [#6494](https://github.com/withastro/astro/pull/6494) [`a13e9d7e3`](https://github.com/withastro/astro/commit/a13e9d7e33baccf51e7d4815f99b481ad174bc57) Thanks [@Yan-Thomas](https://github.com/Yan-Thomas)! - Consistency improvements to several package descriptions

## 2.1.0

### Minor Changes

- [#6213](https://github.com/withastro/astro/pull/6213) [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updated compilation settings to disable downlevelling for Node 14

## 2.0.0

### Major Changes

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 14. Minimum supported Node version is now >=16.12.0

## 2.0.0-beta.0

<details>
<summary>See changes in 2.0.0-beta.0</summary>

### Major Changes

- [#5782](https://github.com/withastro/astro/pull/5782) [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove support for Node 14. Minimum supported Node version is now >=16.12.0

</details>

## 1.0.2

### Patch Changes

- [#5281](https://github.com/withastro/astro/pull/5281) [`a558cf317`](https://github.com/withastro/astro/commit/a558cf317a98bfb79688a31ddb81c910e16e79c2) Thanks [@aleksa-codes](https://github.com/aleksa-codes)! - Update URLs in package.json

## 1.0.1

### Patch Changes

- [#4251](https://github.com/withastro/astro/pull/4251) [`1f0dd31d9`](https://github.com/withastro/astro/commit/1f0dd31d9239b5e3dca99c88d021e7a9a3e2054d) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix `<Prism />` component indentation

  Prefer `class="language-plaintext"` to `class="language-undefined"`

## 1.0.0

### Major Changes

- [`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308) - > Astro v1.0 is out! Read the [official announcement post](https://astro.build/blog/astro-1/).

  **No breaking changes**. This package is now officially stable and compatible with `astro@1.0.0`!

## 0.7.0

### Minor Changes

- [#4114](https://github.com/withastro/astro/pull/4114) [`64432bcb8`](https://github.com/withastro/astro/commit/64432bcb873efd0e4297c00fc9583a1fe516dfe7) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Refactor `@astrojs/mdx` and `@astrojs/markdown-remark` to use `@astrojs/prism` instead of duplicating the code

## 0.6.1

### Patch Changes

- [#3937](https://github.com/withastro/astro/pull/3937) [`31f9c0bf0`](https://github.com/withastro/astro/commit/31f9c0bf029ffa4b470e620f2c32e1370643e81e) Thanks [@delucis](https://github.com/delucis)! - Roll back supported Node engines

## 0.6.0

### Minor Changes

- [#3914](https://github.com/withastro/astro/pull/3914) [`b48767985`](https://github.com/withastro/astro/commit/b48767985359bd359df8071324952ea5f2bc0d86) Thanks [@ran-dall](https://github.com/ran-dall)! - Rollback supported `node@16` version. Minimum versions are now `node@14.20.0` or `node@16.14.0`.

## 0.5.0

### Minor Changes

- [#3871](https://github.com/withastro/astro/pull/3871) [`1cc5b7890`](https://github.com/withastro/astro/commit/1cc5b78905633608e5b07ad291f916f54e67feb1) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update supported `node` versions. Minimum versions are now `node@14.20.0` or `node@16.16.0`.

## 0.4.1

### Patch Changes

- [#2878](https://github.com/withastro/astro/pull/2878) [`2db97f10`](https://github.com/withastro/astro/commit/2db97f10dc50f9498413181b78c477fe8833895b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Move the built-in `Prism` component from `astro/components` to `@astrojs/prism/component`.

## 0.4.1-next.0

### Patch Changes

- [#2878](https://github.com/withastro/astro/pull/2878) [`2db97f10`](https://github.com/withastro/astro/commit/2db97f10dc50f9498413181b78c477fe8833895b) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Move the built-in `Prism` component from `astro/components` to `@astrojs/prism/component`.

## 0.4.0

### Minor Changes

- [#2202](https://github.com/withastro/astro/pull/2202) [`45cea6ae`](https://github.com/withastro/astro/commit/45cea6aec5a310fed4cb8da0d96670d6b99a2539) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Officially drop support for Node v12. The minimum supported version is now Node v14.15+,

## 0.3.0

### Patch Changes

- e6aaeff5: - Adds compatibility to work with Astro 0.21.
  - New typings added for the primary export.

## 0.3.0-next.0

### Minor Changes

- d84bfe71: Adds typings for the main entrypoint

## 0.2.2

### Patch Changes

- f9f2da4: Add repository key to all package.json

## 0.2.1

### Patch Changes

- ab2972b: Update package.json engines for esm support

## 0.0.2

### Patch Changes

- d924fcb: Fix issue with Prism component missing dependency
