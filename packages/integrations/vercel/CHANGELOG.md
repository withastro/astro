# @astrojs/vercel

## 0.2.4

### Patch Changes

- [#3677](https://github.com/withastro/astro/pull/3677) [`8045c8ad`](https://github.com/withastro/astro/commit/8045c8ade16fe4306448b7f98a4560ef0557d378) Thanks [@Jutanium](https://github.com/Jutanium)! - Update READMEs

## 0.2.3

### Patch Changes

- Updated dependencies [[`4de53ecc`](https://github.com/withastro/astro/commit/4de53eccef346bed843b491b7ab93987d7d85655)]:
  - @astrojs/webapi@0.12.0

## 0.2.2

### Patch Changes

- [#3368](https://github.com/withastro/astro/pull/3368) [`9d01f93b`](https://github.com/withastro/astro/commit/9d01f93b1c7db5d4afc4041e6ee73fb52f24d2d1) Thanks [@JuanM04](https://github.com/JuanM04)! - Remove `nodeVersion` option for `serverless` target. Now it is inferred from Vercel

## 0.2.1

### Patch Changes

- [#3355](https://github.com/withastro/astro/pull/3355) [`945f5c68`](https://github.com/withastro/astro/commit/945f5c68e892f6f17e59e41d0dfa2a7841f96bbf) Thanks [@JuanM04](https://github.com/JuanM04)! - Added typescript definitions

## 0.2.0

### Minor Changes

- [#3216](https://github.com/withastro/astro/pull/3216) [`114bf63e`](https://github.com/withastro/astro/commit/114bf63e11f28299b13178ef1a412eed37ab7909) Thanks [@JuanM04](https://github.com/JuanM04)! - **[BREAKING]** Now with Build Output API (v3)! [See the README to get started](https://github.com/withastro/astro/tree/main/packages/integrations/vercel#readme).

  - `trailingSlash` redirects works without a `vercel.json` file: just configure them inside your `astro.config.mjs`
  - Multiple deploy targets: `edge`, `serverless` and `static`!
  - When building to `serverless`, your code isn't transpiled to CJS anymore.

  **Migrate from v0.1**

  1. Change the import inside `astro.config.mjs`:
     ```diff
     - import vercel from '@astrojs/vercel';
     + import vercel from '@astrojs/vercel/serverless';
     ```
  2. Rename the `ENABLE_FILE_SYSTEM_API` environment variable to `ENABLE_VC_BUILD`, as Vercel changed it.
  3. The output folder changed from `.output` to `.vercel/output` — you may need to update your `.gitignore`.

## 0.1.4

### Patch Changes

- [`cafd36ef`](https://github.com/withastro/astro/commit/cafd36ef774755b8efbe9e526a0b5ce7a47095f2) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update README

* [#3185](https://github.com/withastro/astro/pull/3185) [`eaad1769`](https://github.com/withastro/astro/commit/eaad17694f2120ddbd083bb1754e4418b8ea6aa9) Thanks [@JuanM04](https://github.com/JuanM04)! - Fixed `trailingSlash` for non-HTML pages

- [#3176](https://github.com/withastro/astro/pull/3176) [`725c44a7`](https://github.com/withastro/astro/commit/725c44a762dbc2f45a1d47ffa31b7e6e0b22ff95) Thanks [@JuanM04](https://github.com/JuanM04)! - Support trailingSlash

## 0.1.3

### Patch Changes

- [#3051](https://github.com/withastro/astro/pull/3051) [`b0ba22c5`](https://github.com/withastro/astro/commit/b0ba22c5ffab6575706ae904d0ad8cadc3f48d43) Thanks [@JuanM04](https://github.com/JuanM04)! - Fixed issues when converting from ESM to CJS

* [#3139](https://github.com/withastro/astro/pull/3139) [`4ac37973`](https://github.com/withastro/astro/commit/4ac3797344943df4124abd4043deda624440f035) Thanks [@JuanM04](https://github.com/JuanM04)! - Added warning when `ENABLE_FILE_SYSTEM_API` is not found

## 0.1.2

### Patch Changes

- [#3081](https://github.com/withastro/astro/pull/3081) [`f665d1a2`](https://github.com/withastro/astro/commit/f665d1a250ef34a9d1cbced9e4441c7e2dc246b8) Thanks [@JuanM04](https://github.com/JuanM04)! - Support dynamic paths

## 0.1.1

### Patch Changes

- [`815d62f1`](https://github.com/withastro/astro/commit/815d62f151a36fef7d09590d4962ca71bda61b32) Thanks [@FredKSchott](https://github.com/FredKSchott)! - no changes.

## 0.1.0

### Patch Changes

- [#3028](https://github.com/withastro/astro/pull/3028) [`982f64f6`](https://github.com/withastro/astro/commit/982f64f69a82d3c5f99b326a2ddcd368435d9b4a) Thanks [@JuanM04](https://github.com/JuanM04)! - Updated esbuild

* [#3008](https://github.com/withastro/astro/pull/3008) [`8bd49c95`](https://github.com/withastro/astro/commit/8bd49c95365f7bbce41e19b7e8658ad639c22f31) Thanks [@JuanM04](https://github.com/JuanM04)! - Updated integrations' `astro:build:done` hook: now it matches the client dist when using SSR

- [#3022](https://github.com/withastro/astro/pull/3022) [`8c04ff1f`](https://github.com/withastro/astro/commit/8c04ff1f0bea42d033832ce5047076e315cb38a3) Thanks [@matthewp](https://github.com/matthewp)! - Allows adapters to export default

* [#3000](https://github.com/withastro/astro/pull/3000) [`b5ed099e`](https://github.com/withastro/astro/commit/b5ed099eaf92b61faf2fb66ebd7179d3e8223ae5) Thanks [@JuanM04](https://github.com/JuanM04)! - Fixed build directory and clean-up

## 0.0.3-beta.1

### Patch Changes

- [#3022](https://github.com/withastro/astro/pull/3022) [`8c04ff1f`](https://github.com/withastro/astro/commit/8c04ff1f0bea42d033832ce5047076e315cb38a3) Thanks [@matthewp](https://github.com/matthewp)! - Allows adapters to export default

## 0.0.3-beta.0

### Patch Changes

- [#3008](https://github.com/withastro/astro/pull/3008) [`8bd49c95`](https://github.com/withastro/astro/commit/8bd49c95365f7bbce41e19b7e8658ad639c22f31) Thanks [@JuanM04](https://github.com/JuanM04)! - Updated integrations' `astro:build:done` hook: now it matches the client dist when using SSR

* [#3000](https://github.com/withastro/astro/pull/3000) [`b5ed099e`](https://github.com/withastro/astro/commit/b5ed099eaf92b61faf2fb66ebd7179d3e8223ae5) Thanks [@JuanM04](https://github.com/JuanM04)! - Fixed build directory and clean-up

## 0.0.2

### Patch Changes

- [#2915](https://github.com/withastro/astro/pull/2915) [`e30aa4df`](https://github.com/withastro/astro/commit/e30aa4dfef2bbe874e2fe7f07232bf8a3c092317) Thanks [@JuanM04](https://github.com/JuanM04)! - Add a Vercel adapter for SSR
