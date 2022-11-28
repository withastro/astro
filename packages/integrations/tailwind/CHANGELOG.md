# @astrojs/tailwind

## 2.1.3

### Patch Changes

- [#5450](https://github.com/withastro/astro/pull/5450) [`cef33dd84`](https://github.com/withastro/astro/commit/cef33dd841b7d4d9437efac54f7e185a40cc3d4b) Thanks [@chenxsan](https://github.com/chenxsan)! - Remove temp tailwind config file in finally

## 2.1.2

### Patch Changes

- [#5270](https://github.com/withastro/astro/pull/5270) [`bb6e88000`](https://github.com/withastro/astro/commit/bb6e8800094dc59841eb3b345fcb8baca9e17ce9) Thanks [@matthewp](https://github.com/matthewp)! - Prevent errors during HMR from crashing dev server

## 2.1.1

### Patch Changes

- [#5082](https://github.com/withastro/astro/pull/5082) [`5fb7c9383`](https://github.com/withastro/astro/commit/5fb7c9383abf6ccdabdb96b682f683369a8e11fe) Thanks [@matthewp](https://github.com/matthewp)! - Make Tailwind integration compatible with Astro < 1.5

## 2.1.0

### Minor Changes

- [#4947](https://github.com/withastro/astro/pull/4947) [`a5e3ecc80`](https://github.com/withastro/astro/commit/a5e3ecc8039c1e115ce5597362e18cd35d04e40b) Thanks [@JuanM04](https://github.com/JuanM04)! - ## HMR on config file changes

  New in this release is the ability for config changes to automatically reflect via HMR. Now when you edit your `tsconfig.json` or `tailwind.config.js` configs, the changes will reload automatically without the need to restart your dev server.

## 2.0.2

### Patch Changes

- [#4842](https://github.com/withastro/astro/pull/4842) [`812658ad2`](https://github.com/withastro/astro/commit/812658ad2ab3732a99e35c4fd903e302e723db46) Thanks [@bluwy](https://github.com/bluwy)! - Add missing dependencies, support strict dependency installation (e.g. pnpm)

## 2.0.1

### Patch Changes

- [#4758](https://github.com/withastro/astro/pull/4758) [`0398efa39`](https://github.com/withastro/astro/commit/0398efa39f14f40e77dc8e87f08e9f100a0fef34) Thanks [@delucis](https://github.com/delucis)! - Update Tailwind manual install guide for v2

## 2.0.0

### Migration to v2

Tailwind CSS is now a peer dependency, so you will need to install it manually when updating this integration:

```
npm install tailwindcss
```

### Major Changes

- [#4543](https://github.com/withastro/astro/pull/4543) [`664ebf449`](https://github.com/withastro/astro/commit/664ebf449e27f0aef43eaa2482189358a74209d2) Thanks [@aFuzzyBear](https://github.com/aFuzzyBear)! - Update peer dep with Tailwindcss

## 1.0.1

### Patch Changes

- [#4662](https://github.com/withastro/astro/pull/4662) [`8cfb3fb53`](https://github.com/withastro/astro/commit/8cfb3fb535a16ebb1c185de2609435fdd7954611) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Update README to reference a `.cjs` config file

## 1.0.0

### Major Changes

- [`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308) - > Astro v1.0 is out! Read the [official announcement post](https://astro.build/blog/astro-1/).

  **No breaking changes**. This package is now officially stable and compatible with `astro@1.0.0`!

## 0.2.5

### Patch Changes

- [#4004](https://github.com/withastro/astro/pull/4004) [`ef9c4152b`](https://github.com/withastro/astro/commit/ef9c4152b2b399e25bf4e8aa7b37adcf6d0d8f17) Thanks [@sarah11918](https://github.com/sarah11918)! - [READMEs] removed "experimental" from astro add instructions

## 0.2.4

### Patch Changes

- [#3885](https://github.com/withastro/astro/pull/3885) [`bf5d1cc1e`](https://github.com/withastro/astro/commit/bf5d1cc1e71da38a14658c615e9481f2145cc6e7) Thanks [@delucis](https://github.com/delucis)! - Integration README fixes

## 0.2.3

### Patch Changes

- [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.2.2

### Patch Changes

- [#3732](https://github.com/withastro/astro/pull/3732) [`6360f474`](https://github.com/withastro/astro/commit/6360f474fb8cecaf4fe27e9184058b57da1df72a) Thanks [@inwardmovement](https://github.com/inwardmovement)! - Marks the Tailwind integration config as optional to fix TypeScript validation warnings

## 0.2.1

### Patch Changes

- [#3183](https://github.com/withastro/astro/pull/3183) [`7a61977d`](https://github.com/withastro/astro/commit/7a61977db11c4472f9210b8de22ec281870e5dc3) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Support "astro add" before installing project dependencies

## 0.2.0

### Minor Changes

- [#3099](https://github.com/withastro/astro/pull/3099) [`254a8f37`](https://github.com/withastro/astro/commit/254a8f37499863c5684fb0d5b0f59a8cee093d0b) Thanks [@tony-sull](https://github.com/tony-sull)! - Removes the `applyAstroPreset` integration option. Tailwind presets can be disabled directly from the Tailwind config file by including `presets: []`

  See the [Tailwind preset docs](https://tailwindcss.com/docs/presets#disabling-the-default-configuration) for more details.

## 0.1.2

### Patch Changes

- [`815d62f1`](https://github.com/withastro/astro/commit/815d62f151a36fef7d09590d4962ca71bda61b32) Thanks [@FredKSchott](https://github.com/FredKSchott)! - no changes.

## 0.1.1

### Patch Changes

- [`c05a544a`](https://github.com/withastro/astro/commit/c05a544acd5c9dd4f57b53ce21e82141212a3c2c) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update README

## 0.1.0

### Minor Changes

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update config options to resepect [RFC0019](https://github.com/withastro/rfcs/blob/main/proposals/0019-config-finalization.md)

### Patch Changes

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Adds an option to opt-out of the default base styles for the Tailwind integration

## 0.0.2

### Patch Changes

- [#2831](https://github.com/withastro/astro/pull/2831) [`5315c3f7`](https://github.com/withastro/astro/commit/5315c3f7bc0649f9788713f689f484e223bc0ca6) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add support for tailwind config files. These can either be a standard `tailwind.config.js|cjs|mjs`, or a custom filename as specified in your integration config.

* [#2885](https://github.com/withastro/astro/pull/2885) [`6b004363`](https://github.com/withastro/astro/commit/6b004363f99f27e581d1e2d53a2ebff39d7afb8a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add README across Astro built-in integrations

- [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site

## 0.0.2-next.0

### Patch Changes

- [#2831](https://github.com/withastro/astro/pull/2831) [`5315c3f7`](https://github.com/withastro/astro/commit/5315c3f7bc0649f9788713f689f484e223bc0ca6) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add support for tailwind config files. These can either be a standard `tailwind.config.js|cjs|mjs`, or a custom filename as specified in your integration config.

* [#2847](https://github.com/withastro/astro/pull/2847) [`3b621f7a`](https://github.com/withastro/astro/commit/3b621f7a613b45983b090794fa7c015f23ed6140) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds keywords to the official integrations to support discoverability on Astro's Integrations site
