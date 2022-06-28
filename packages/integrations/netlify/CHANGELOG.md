# @astrojs/netlify

## 0.4.7

### Patch Changes

- [#3734](https://github.com/withastro/astro/pull/3734) [`4acd245d`](https://github.com/withastro/astro/commit/4acd245d8f59871eb9c0083ae1a0fe7aa70c84f5) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: append shim to top of built file to avoid "can't read process of undefined" issues

## 0.4.6

### Patch Changes

- [#3673](https://github.com/withastro/astro/pull/3673) [`ba5ad785`](https://github.com/withastro/astro/commit/ba5ad7855c4252e10e76b41b88fd4c74b4b7295b) Thanks [@hippotastic](https://github.com/hippotastic)! - Fix react dependencies to improve test reliability

## 0.4.5

### Patch Changes

- [#3612](https://github.com/withastro/astro/pull/3612) [`fca58cfd`](https://github.com/withastro/astro/commit/fca58cfd91b68501ec82350ab023170b208d8ce7) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: "vpath" import error when building for netlify edge

## 0.4.4

### Patch Changes

- [#3592](https://github.com/withastro/astro/pull/3592) [`0ddcef20`](https://github.com/withastro/astro/commit/0ddcef2043e3c2f65aaeec7a969c374c053e22f3) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds support for base64 encoded responses in Netlify Functions

## 0.4.3

### Patch Changes

- [#3535](https://github.com/withastro/astro/pull/3535) [`f3ab822e`](https://github.com/withastro/astro/commit/f3ab822e328725c3905b0adad9889ad37653c24a) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Netlify Edge Function and Astro.glob

## 0.4.2

### Patch Changes

- [#3503](https://github.com/withastro/astro/pull/3503) [`207f58d1`](https://github.com/withastro/astro/commit/207f58d1715ac024cc7c81b76e26aa49fca5173f) Thanks [@williamtetlow](https://github.com/williamtetlow)! - Alias `from 'astro'` imports to `'@astro/types'`
  Update Deno and Netlify integrations to handle vite.resolves.alias as an array

## 0.4.1

### Patch Changes

- Updated dependencies [[`4de53ecc`](https://github.com/withastro/astro/commit/4de53eccef346bed843b491b7ab93987d7d85655)]:
  - @astrojs/webapi@0.12.0

## 0.4.0

### Minor Changes

- [#3381](https://github.com/withastro/astro/pull/3381) [`43d92227`](https://github.com/withastro/astro/commit/43d922277afaeca9c90364fbf0b19477fd2c6566) Thanks [@sarahetter](https://github.com/sarahetter)! - Updating out directories for Netlify Functions

* [#3377](https://github.com/withastro/astro/pull/3377) [`e1294c42`](https://github.com/withastro/astro/commit/e1294c422b3d3e98ccc745fe95d5672c9a17fe1f) Thanks [@sarahetter](https://github.com/sarahetter)! - Change out directories on dist and serverEntry

## 0.3.4

### Patch Changes

- [#3342](https://github.com/withastro/astro/pull/3342) [`352fc316`](https://github.com/withastro/astro/commit/352fc3166fe3b3d3da3feff621394b20eacb9cc3) Thanks [@thepassle](https://github.com/thepassle)! - create redirects file for netlify edge adapter

## 0.3.3

### Patch Changes

- [#3170](https://github.com/withastro/astro/pull/3170) [`19667c45`](https://github.com/withastro/astro/commit/19667c45f318ec13cdc2b51016f3fa3487b2a32d) Thanks [@matthewp](https://github.com/matthewp)! - Netlify Edge: Forward requests for static assets

## 0.3.2

### Patch Changes

- [#3160](https://github.com/withastro/astro/pull/3160) [`ae9ac5cb`](https://github.com/withastro/astro/commit/ae9ac5cbdceba0687d83d56d9d5f80479ab88710) Thanks [@matthewp](https://github.com/matthewp)! - Allows using React.lazy, Suspense in SSR and with hydration

## 0.3.1

### Patch Changes

- [#3150](https://github.com/withastro/astro/pull/3150) [`05cf1a50`](https://github.com/withastro/astro/commit/05cf1a506702f06ed48cd26cbe5ca108839ff0e6) Thanks [@matthewp](https://github.com/matthewp)! - Outputs manifest.json in correct folder for Netlify Edge Functions

## 0.3.0

### Minor Changes

- [#3148](https://github.com/withastro/astro/pull/3148) [`4cf54c60`](https://github.com/withastro/astro/commit/4cf54c60aa63bd614b242da0602790015005673d) Thanks [@matthewp](https://github.com/matthewp)! - Adds support for Netlify Edge Functions

## 0.2.3

### Patch Changes

- [#3092](https://github.com/withastro/astro/pull/3092) [`a5caf08e`](https://github.com/withastro/astro/commit/a5caf08e2494e9f779baa6b288d277490dd436b8) Thanks [@matthewp](https://github.com/matthewp)! - Fixes setting multiple cookies with the Netlify adapter

## 0.2.2

### Patch Changes

- [#3079](https://github.com/withastro/astro/pull/3079) [`9f248b05`](https://github.com/withastro/astro/commit/9f248b0563828db0e01e685aac177eaf8107906e) Thanks [@hippotastic](https://github.com/hippotastic)! - Make Netlify adapter actually append redirects

## 0.2.1

### Patch Changes

- [`815d62f1`](https://github.com/withastro/astro/commit/815d62f151a36fef7d09590d4962ca71bda61b32) Thanks [@FredKSchott](https://github.com/FredKSchott)! - no changes.

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
