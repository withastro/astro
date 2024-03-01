# @astrojs/upgrade

## 0.2.3

### Patch Changes

- [#10117](https://github.com/withastro/astro/pull/10117) [`51b6ff7403c1223b1c399e88373075972c82c24c`](https://github.com/withastro/astro/commit/51b6ff7403c1223b1c399e88373075972c82c24c) Thanks [@hippotastic](https://github.com/hippotastic)! - Fixes an issue where `create astro`, `astro add` and `@astrojs/upgrade` would fail due to unexpected package manager CLI output.

## 0.2.2

### Patch Changes

- [#9562](https://github.com/withastro/astro/pull/9562) [`67e06f9db1b0492ccfb4b053762dc91d69a53ecb`](https://github.com/withastro/astro/commit/67e06f9db1b0492ccfb4b053762dc91d69a53ecb) Thanks [@DET171](https://github.com/DET171)! - Updates the command used for installing packages with pnpm and yarn

## 0.2.1

### Patch Changes

- [#9317](https://github.com/withastro/astro/pull/9317) [`d1c91add0`](https://github.com/withastro/astro/commit/d1c91add074c2e08056f01df5a6043c9716b7e1f) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Improves dependency handling by ignoring packages that don't use a semver version

## 0.2.0

### Minor Changes

- [#9118](https://github.com/withastro/astro/pull/9118) [`000e8f465`](https://github.com/withastro/astro/commit/000e8f4654cae9982e21e0a858366c4844139db6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Initial release!

  `@astrojs/upgrade` is an automated command-line tool for upgrading Astro and your official Astro integrations together.

  Inside of your existing `astro` project, run the following command to install the `latest` version of your integrations.

  **With NPM:**

  ```bash
  npx @astrojs/upgrade
  ```

  **With Yarn:**

  ```bash
  yarn dlx @astrojs/upgrade
  ```

  **With PNPM:**

  ```bash
  pnpm dlx @astrojs/upgrade
  ```

## 0.1.0-beta.0

### Minor Changes

- [#9118](https://github.com/withastro/astro/pull/9118) [`000e8f465`](https://github.com/withastro/astro/commit/000e8f4654cae9982e21e0a858366c4844139db6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Initial release!

  `@astrojs/upgrade` is an automated command-line tool for upgrading Astro and your official Astro integrations together.

  Inside of your existing `astro` project, run the following command to install the `latest` version of your integrations.

  **With NPM:**

  ```bash
  npx @astrojs/upgrade
  ```

  **With Yarn:**

  ```bash
  yarn dlx @astrojs/upgrade
  ```

  **With PNPM:**

  ```bash
  pnpm dlx @astrojs/upgrade
  ```

## 0.1.1

### Patch Changes

- [#9213](https://github.com/withastro/astro/pull/9213) [`54e57fe9d`](https://github.com/withastro/astro/commit/54e57fe9d7600c888fc7b0bc3f5dbca5543f36cd) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix unhandled error when running `@astrojs/upgrade beta` outside of a monorepo

## 0.1.0

### Minor Changes

- [#8525](https://github.com/withastro/astro/pull/8525) [`5a3875018`](https://github.com/withastro/astro/commit/5a38750188d1af30ea5277cea70f454c363b5062) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Initial release!

  `@astrojs/upgrade` is an automated command-line tool for upgrading Astro and your official Astro integrations together.

  Inside of your existing `astro` project, run the following command to install the `latest` version of your integrations.

  **With NPM:**

  ```bash
  npx @astrojs/upgrade
  ```

  **With Yarn:**

  ```bash
  yarn dlx @astrojs/upgrade
  ```

  **With PNPM:**

  ```bash
  pnpm dlx @astrojs/upgrade
  ```
