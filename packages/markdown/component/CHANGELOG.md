# @astrojs/markdown-component

## 1.0.5

### Patch Changes

- [#7343](https://github.com/withastro/astro/pull/7343) [`3d9a392a0`](https://github.com/withastro/astro/commit/3d9a392a09133aeb7a6efeb59c307f27a9b83198) Thanks [@matthewp](https://github.com/matthewp)! - Fix Markdown component error message false positive

## 1.0.4

### Patch Changes

- [#7104](https://github.com/withastro/astro/pull/7104) [`826e02890`](https://github.com/withastro/astro/commit/826e0289005f645b902375b98d5549c6a95ccafa) Thanks [@bluwy](https://github.com/bluwy)! - Specify `"files"` field to only publish necessary files

## 1.0.3

### Patch Changes

- [#6494](https://github.com/withastro/astro/pull/6494) [`a13e9d7e3`](https://github.com/withastro/astro/commit/a13e9d7e33baccf51e7d4815f99b481ad174bc57) Thanks [@Yan-Thomas](https://github.com/Yan-Thomas)! - Consistency improvements to several package descriptions

## 1.0.2

### Patch Changes

- [#5281](https://github.com/withastro/astro/pull/5281) [`a558cf317`](https://github.com/withastro/astro/commit/a558cf317a98bfb79688a31ddb81c910e16e79c2) Thanks [@aleksa-codes](https://github.com/aleksa-codes)! - Update URLs in package.json

## 1.0.1

### Patch Changes

- [#4208](https://github.com/withastro/astro/pull/4208) [`fe3b42398`](https://github.com/withastro/astro/commit/fe3b423982faa87c106e6a072bb14cb0a6678064) Thanks [@myakura](https://github.com/myakura)! - README update

## 1.0.0

### Major Changes

- [`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308) - > Astro v1.0 is out! Read the [official announcement post](https://astro.build/blog/astro-1/).

  **No breaking changes**. This package is now officially stable and compatible with `astro@1.0.0`!

## 0.2.1

### Patch Changes

- [#4085](https://github.com/withastro/astro/pull/4085) [`c15cb3663`](https://github.com/withastro/astro/commit/c15cb36636320012c7d0c9d6ac8620029da70b0b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix TypeScript error when importing the component

## 0.2.0

### Minor Changes

- [#4016](https://github.com/withastro/astro/pull/4016) [`00fab4ce1`](https://github.com/withastro/astro/commit/00fab4ce135eb799cac69140403d7724686733d6) Thanks [@bholmesdev](https://github.com/bholmesdev)! - The use of components and JSX expressions in Markdown are no longer supported by default.

  For long term support, migrate to the `@astrojs/mdx` integration for MDX support (including `.mdx` pages!).

  Not ready to migrate to MDX? Add the legacy flag to your Astro config to re-enable the previous Markdown support.

  ```js
  // https://astro.build/config
  export default defineConfig({
    legacy: {
      astroFlavoredMarkdown: true,
    },
  });
  ```

* [#3986](https://github.com/withastro/astro/pull/3986) [`bccd88f0e`](https://github.com/withastro/astro/commit/bccd88f0ebe1fbf383c0cee4b27a4c24c72dea72) Thanks [@matthewp](https://github.com/matthewp)! - Move the Markdown component to its own package

  This change moves the Markdown component into its own package where it will be maintained separately. All that needs to change from a user's perspective is the import statement:

  ```astro

  ```

  Becomes:

  ```astro

  ```
