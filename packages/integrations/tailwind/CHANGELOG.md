# @astrojs/tailwind

## 3.1.0

### Minor Changes

- [#6213](https://github.com/withastro/astro/pull/6213) [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updated compilation settings to disable downlevelling for Node 14

### Patch Changes

- Updated dependencies [[`fec583909`](https://github.com/withastro/astro/commit/fec583909ab62829dc0c1600e2387979365f2b94), [`b087b83fe`](https://github.com/withastro/astro/commit/b087b83fe266c431fe34a07d5c2293cc4ab011c6), [`694918a56`](https://github.com/withastro/astro/commit/694918a56b01104831296be0c25456135a63c784), [`a20610609`](https://github.com/withastro/astro/commit/a20610609863ae3b48afe96819b8f11ae4f414d5), [`a4a74ab70`](https://github.com/withastro/astro/commit/a4a74ab70cd2aa0d812a1f6b202c4e240a8913bf), [`75921b3cd`](https://github.com/withastro/astro/commit/75921b3cd916d439f6392c487c21532fde35ed13), [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808)]:
  - astro@2.1.0

## 3.0.1

### Patch Changes

- [#5478](https://github.com/withastro/astro/pull/5478) [`1c7eef308`](https://github.com/withastro/astro/commit/1c7eef308e808aa5ed4662b53e67ec8d1b814d1f) Thanks [@nemo0](https://github.com/nemo0)! - Update READMEs for consistency

- [#6002](https://github.com/withastro/astro/pull/6002) [`254eb21c8`](https://github.com/withastro/astro/commit/254eb21c8384a920830d85d7a43cd6281df926c6) Thanks [@royeden](https://github.com/royeden)! - Re-enable autoprefixer in dev

- Updated dependencies [[`b4432cd6b`](https://github.com/withastro/astro/commit/b4432cd6b65bad685a99fe15867710b0663c13b2), [`98a4a914b`](https://github.com/withastro/astro/commit/98a4a914bc47f3da2764b3bdc01577d25fe2e261), [`071e1dee7`](https://github.com/withastro/astro/commit/071e1dee7e1943be67d1ded39a9af1b7a2aafd02), [`322e059d0`](https://github.com/withastro/astro/commit/322e059d0da9ab0d6a546a111fabda755bd5f1b6), [`b994f6f35`](https://github.com/withastro/astro/commit/b994f6f35e29b2d93ff8ddc281a69c0af3cc3edf), [`12c68343c`](https://github.com/withastro/astro/commit/12c68343c0aa891037d39d3c9b9378b004be6642)]:
  - astro@2.0.3

## 3.0.0

### Major Changes

- [#5717](https://github.com/withastro/astro/pull/5717) [`a3a7fc929`](https://github.com/withastro/astro/commit/a3a7fc9298e6d88abb4b7bee1e58f05fa9558cf1) Thanks [@bluwy](https://github.com/bluwy)! - Remove `style.postcss` Astro config. Refactor Tailwind integration to configure through `vite` instead. Also disables `autoprefixer` in dev.

- [#5806](https://github.com/withastro/astro/pull/5806) [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53) Thanks [@matthewp](https://github.com/matthewp)! - Make astro a `peerDependency` of integrations

  This marks `astro` as a `peerDependency` of several packages that are already getting `major` version bumps. This is so we can more properly track the dependency between them and what version of Astro they are being used with.

### Patch Changes

- [#5908](https://github.com/withastro/astro/pull/5908) [`9e57268f1`](https://github.com/withastro/astro/commit/9e57268f1318853b612711b31d7461e9b9ce1978) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Fix Vite not picking up PostCSS config files because of the Tailwind integration

- Updated dependencies [[`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b), [`16dc36a87`](https://github.com/withastro/astro/commit/16dc36a870df47a4151a8ed2d91d0bd1bb812458), [`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029), [`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144), [`05caf445d`](https://github.com/withastro/astro/commit/05caf445d4d2728f1010aeb2179a9e756c2fd17d), [`49ab4f231`](https://github.com/withastro/astro/commit/49ab4f231c23b34891c3ee86f4b92bf8d6d267a3), [`a342a486c`](https://github.com/withastro/astro/commit/a342a486c2831461e24e6c2f1ca8a9d3e15477b6), [`8fb28648f`](https://github.com/withastro/astro/commit/8fb28648f66629741cb976bfe34ccd9d8f55661e), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63), [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b), [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a), [`ce5c5dbd4`](https://github.com/withastro/astro/commit/ce5c5dbd46afbe738b03600758bf5c35113de522), [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2), [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4), [`259a539d7`](https://github.com/withastro/astro/commit/259a539d7d70c783330c797794b15716921629cf), [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a), [`4987d6f44`](https://github.com/withastro/astro/commit/4987d6f44cfd0d81d88f21f5c380503403dc1e6a), [`304823811`](https://github.com/withastro/astro/commit/304823811eddd8e72aa1d8e2d39b40ab5cda3565), [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5), [`55cea0a9d`](https://github.com/withastro/astro/commit/55cea0a9d8c8df91a46590fc04a9ac28089b3432), [`dd56c1941`](https://github.com/withastro/astro/commit/dd56c19411b126439b8bc42d681b6fa8c06e8c61), [`9963c6e4d`](https://github.com/withastro/astro/commit/9963c6e4d50c392c3d1ac4492237020f15ccb1de), [`be901dc98`](https://github.com/withastro/astro/commit/be901dc98c4a7f6b5536540aa8f7ba5108e939a0), [`f6cf92b48`](https://github.com/withastro/astro/commit/f6cf92b48317a19a3840ad781b77d6d3cae143bb), [`e818cc046`](https://github.com/withastro/astro/commit/e818cc0466a942919ea3c41585e231c8c80cb3d0), [`8c100a6fe`](https://github.com/withastro/astro/commit/8c100a6fe6cc652c3799d1622e12c2c969f30510), [`116d8835c`](https://github.com/withastro/astro/commit/116d8835ca9e78f8b5e477ee5a3d737b69f80706), [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d), [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d), [`7325df412`](https://github.com/withastro/astro/commit/7325df412107fc0e65cd45c1b568fb686708f723), [`16c7d0bfd`](https://github.com/withastro/astro/commit/16c7d0bfd49d2b9bfae45385f506bcd642f9444a), [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d), [`2a5786419`](https://github.com/withastro/astro/commit/2a5786419599b8674473c699300172b9aacbae2e), [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa), [`a8d3e7924`](https://github.com/withastro/astro/commit/a8d3e79246605d252dcddad159e358e2d79bd624), [`fa8c131f8`](https://github.com/withastro/astro/commit/fa8c131f88ef67d14c62f1c00c97ed74d43a80ac), [`64b8082e7`](https://github.com/withastro/astro/commit/64b8082e776b832f1433ed288e6f7888adb626d0), [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481), [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb), [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1), [`a3a7fc929`](https://github.com/withastro/astro/commit/a3a7fc9298e6d88abb4b7bee1e58f05fa9558cf1), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`5fd9208d4`](https://github.com/withastro/astro/commit/5fd9208d447f5ab8909a2188b6c2491a0debd49d), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`899214298`](https://github.com/withastro/astro/commit/899214298cee5f0c975c7245e623c649e1842d73), [`3a00ecb3e`](https://github.com/withastro/astro/commit/3a00ecb3eb4bc44be758c064f2bde6e247e8a593), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0), [`1ca81c16b`](https://github.com/withastro/astro/commit/1ca81c16b8b66236e092e6eb6ec3f73f5668421c), [`b66d7195c`](https://github.com/withastro/astro/commit/b66d7195c17a55ea0931bc3744888bd4f5f01ce6)]:
  - astro@2.0.0

## 3.0.0-beta.2

<details>
<summary>See changes in 3.0.0-beta.2</summary>

### Patch Changes

- [#5908](https://github.com/withastro/astro/pull/5908) [`9e57268f1`](https://github.com/withastro/astro/commit/9e57268f1318853b612711b31d7461e9b9ce1978) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Fix Vite not picking up PostCSS config files because of the Tailwind integration

- Updated dependencies [[`4987d6f44`](https://github.com/withastro/astro/commit/4987d6f44cfd0d81d88f21f5c380503403dc1e6a), [`304823811`](https://github.com/withastro/astro/commit/304823811eddd8e72aa1d8e2d39b40ab5cda3565), [`7325df412`](https://github.com/withastro/astro/commit/7325df412107fc0e65cd45c1b568fb686708f723), [`a8d3e7924`](https://github.com/withastro/astro/commit/a8d3e79246605d252dcddad159e358e2d79bd624), [`5fd9208d4`](https://github.com/withastro/astro/commit/5fd9208d447f5ab8909a2188b6c2491a0debd49d)]:
  - astro@2.0.0-beta.4

</details>

## 3.0.0-beta.1

<details>
<summary>See changes in 3.0.0-beta.1</summary>

### Major Changes

- [#5806](https://github.com/withastro/astro/pull/5806) [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53) Thanks [@matthewp](https://github.com/matthewp)! - Make astro a `peerDependency` of integrations

  This marks `astro` as a `peerDependency` of several packages that are already getting `major` version bumps. This is so we can more properly track the dependency between them and what version of Astro they are being used with.

### Patch Changes

- Updated dependencies [[`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63), [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b), [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a), [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2), [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4), [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a), [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5), [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d), [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d), [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa), [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481), [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb), [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0)]:
  - astro@2.0.0-beta.2

</details>

## 3.0.0-beta.0

<details>
<summary>See changes in 3.0.0-beta.0</summary>

### Major Changes

- [#5717](https://github.com/withastro/astro/pull/5717) [`a3a7fc929`](https://github.com/withastro/astro/commit/a3a7fc9298e6d88abb4b7bee1e58f05fa9558cf1) Thanks [@bluwy](https://github.com/bluwy)! - Remove `style.postcss` Astro config. Refactor Tailwind integration to configure through `vite` instead. Also disables `autoprefixer` in dev.

</details>

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

- [`e425f896`](https://github.com/withastro/astro/commit/e425f896b668d98033ad3b998b50c1f28bc7f6ee) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Update config options to respect [RFC0019](https://github.com/withastro/rfcs/blob/main/proposals/0019-config-finalization.md)

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
