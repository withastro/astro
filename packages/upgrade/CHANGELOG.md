# @astrojs/upgrade

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
