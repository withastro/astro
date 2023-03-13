# @astrojs/cloudflare

## 6.2.1

### Patch Changes

- [#6531](https://github.com/withastro/astro/pull/6531) [`4ddf34893`](https://github.com/withastro/astro/commit/4ddf3489384ed53f25df190a3478da44bd38600e) Thanks [@matthewp](https://github.com/matthewp)! - Remove false-positive warnings from Cloudflare's build.

  Cloudflare includes warnings when it bundles the already-built output from astro.build. Those warnings are mostly due to `"sideEffects": false` packages that are included in the Vite built output because they are marked as external. Rollup will remove unused imports from these packages but will not remove the actual import, causing the false-positive warning.

- [#6473](https://github.com/withastro/astro/pull/6473) [`1c3e8f6c3`](https://github.com/withastro/astro/commit/1c3e8f6c3b839087aa51de2e2fb665cd907f2847) Thanks [@RichiCoder1](https://github.com/RichiCoder1)! - fix automatic routes generation not respecting config.base

- [#6494](https://github.com/withastro/astro/pull/6494) [`a13e9d7e3`](https://github.com/withastro/astro/commit/a13e9d7e33baccf51e7d4815f99b481ad174bc57) Thanks [@Yan-Thomas](https://github.com/Yan-Thomas)! - Consistency improvements to several package descriptions

- Updated dependencies [[`acf78c5e2`](https://github.com/withastro/astro/commit/acf78c5e271ec3d4f589782078e2a2044cc1c391), [`04e624d06`](https://github.com/withastro/astro/commit/04e624d062c6ce385f6293afba26f3942c2290c6), [`cc90d7219`](https://github.com/withastro/astro/commit/cc90d72197e1139195e9545105b9a1d339f38e1b), [`a9a6ae298`](https://github.com/withastro/astro/commit/a9a6ae29812339ea00f3b9afd3de09bd9d3733a9), [`6a7cf0712`](https://github.com/withastro/astro/commit/6a7cf0712da23e2c095f4bc4f2512e618bceb38e), [`bfd67ea74`](https://github.com/withastro/astro/commit/bfd67ea749dbc6ffa7c9a671fcc48bea6c04a075), [`f6eddffa0`](https://github.com/withastro/astro/commit/f6eddffa0414d54767e9f9e1ee5a936b8a20146b), [`c63874090`](https://github.com/withastro/astro/commit/c6387409062f1d7c2afc93319748ad57086837c5), [`d637d1ea5`](https://github.com/withastro/astro/commit/d637d1ea5b347b9c724adc895c9006c696ac8fc8), [`637f9bc72`](https://github.com/withastro/astro/commit/637f9bc728ea7d56fc82a862d761385f0dcd9528), [`77a046e88`](https://github.com/withastro/astro/commit/77a046e886c370b737208574b6934f5a1cf2b177)]:
  - astro@2.1.3

## 6.2.0

### Minor Changes

- [#6213](https://github.com/withastro/astro/pull/6213) [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updated compilation settings to disable downlevelling for Node 14

### Patch Changes

- Updated dependencies [[`fec583909`](https://github.com/withastro/astro/commit/fec583909ab62829dc0c1600e2387979365f2b94), [`b087b83fe`](https://github.com/withastro/astro/commit/b087b83fe266c431fe34a07d5c2293cc4ab011c6), [`694918a56`](https://github.com/withastro/astro/commit/694918a56b01104831296be0c25456135a63c784), [`a20610609`](https://github.com/withastro/astro/commit/a20610609863ae3b48afe96819b8f11ae4f414d5), [`a4a74ab70`](https://github.com/withastro/astro/commit/a4a74ab70cd2aa0d812a1f6b202c4e240a8913bf), [`75921b3cd`](https://github.com/withastro/astro/commit/75921b3cd916d439f6392c487c21532fde35ed13), [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808)]:
  - astro@2.1.0

## 6.1.3

### Patch Changes

- [#6208](https://github.com/withastro/astro/pull/6208) [`79f49acbe`](https://github.com/withastro/astro/commit/79f49acbe13673bfc27e794bcfae518f38c4a4fe) Thanks [@mfrachet](https://github.com/mfrachet)! - Fix path file that was generated outside the functions folder

- Updated dependencies [[`79783fc01`](https://github.com/withastro/astro/commit/79783fc0181153a8e379d3f023422510a7467ead), [`baa2dbb3b`](https://github.com/withastro/astro/commit/baa2dbb3b5678b2bd56fb80df99d386f32e274b7), [`8b7cb64da`](https://github.com/withastro/astro/commit/8b7cb64dadfca93c65d62df54754633d398cb2ed)]:
  - astro@2.0.11

## 6.1.2

### Patch Changes

- [#6075](https://github.com/withastro/astro/pull/6075) [`45b41d98f`](https://github.com/withastro/astro/commit/45b41d98f50dc9f76a5004a8b3346f393f1a6cb6) Thanks [@NachoVazquez](https://github.com/NachoVazquez)! - Uses config root path as location for Cloudflare Pages Functions

- Updated dependencies [[`f6fc662c3`](https://github.com/withastro/astro/commit/f6fc662c3c59d164584c6287a930fcd1c9086ee6), [`592386b75`](https://github.com/withastro/astro/commit/592386b75541f3b7f7d95c631f86024b7e2d314d), [`1b591a143`](https://github.com/withastro/astro/commit/1b591a1431b44eacd239ed8f76809916cabca1db), [`bf8d7366a`](https://github.com/withastro/astro/commit/bf8d7366acb57e1b21181cc40fff55a821d8119e), [`ec38a8921`](https://github.com/withastro/astro/commit/ec38a8921f02a275949abcababe1b8afdf8184a2), [`f20a85b64`](https://github.com/withastro/astro/commit/f20a85b642994f240d8c94260fc55ffa1fd14294), [`9f22ac3d0`](https://github.com/withastro/astro/commit/9f22ac3d097ef2cb3b2bbe5343b8a8a49d83425d), [`cee70f5c6`](https://github.com/withastro/astro/commit/cee70f5c6ac9b0d2edc1f8a6f8f5043605576026), [`ac7fb04d6`](https://github.com/withastro/astro/commit/ac7fb04d6b162f28a337918138d5737e2c0fffad), [`d1f5611fe`](https://github.com/withastro/astro/commit/d1f5611febfd020cca4078c71bafe599015edd16), [`2189170be`](https://github.com/withastro/astro/commit/2189170be523f74f244e84ccab22c655219773ce), [`32abe49bd`](https://github.com/withastro/astro/commit/32abe49bd073417b480b1b990f432a837c12eb6f)]:
  - astro@2.0.7

## 6.1.1

### Patch Changes

- [#6046](https://github.com/withastro/astro/pull/6046) [`df3201165`](https://github.com/withastro/astro/commit/df320116528e00ab082396531b4deffbb0707b78) Thanks [@matthewp](https://github.com/matthewp)! - Cloudflare fix for building to directory mode

- Updated dependencies [[`41e97158b`](https://github.com/withastro/astro/commit/41e97158ba90d23d346b6e3ff6c7c14b5ecbe903), [`e779c6242`](https://github.com/withastro/astro/commit/e779c6242418d1d4102e683ca5b851b764c89688)]:
  - astro@2.0.4

## 6.1.0

### Minor Changes

- [#5914](https://github.com/withastro/astro/pull/5914) [`088f5194c`](https://github.com/withastro/astro/commit/088f5194c55a6ec15b2eaf2cfb97f9ef45a24a33) Thanks [@AngusMorton](https://github.com/AngusMorton)! - Re-enable streaming in Cloudflare Pages.

### Patch Changes

- [#5993](https://github.com/withastro/astro/pull/5993) [`9855db676`](https://github.com/withastro/astro/commit/9855db676e61ad616c64382adeaa8c74de05f7e1) Thanks [@matthewp](https://github.com/matthewp)! - Support for prerendering in the Cloudflare integration

  This fixes prerendering in the Cloudflare adapter. Now any prerendered routes are added to the `_routes.json` config so that the worker script is skipped for those routes.

- Updated dependencies [[`b53e0717b`](https://github.com/withastro/astro/commit/b53e0717b7f6b042baaeec7f87999e99c76c031c), [`60b32d585`](https://github.com/withastro/astro/commit/60b32d58565d87e87573eb268408293fc28ec657), [`883e0cc29`](https://github.com/withastro/astro/commit/883e0cc29968d51ed6c7515be035a40b28bafdad), [`dabce6b8c`](https://github.com/withastro/astro/commit/dabce6b8c684f851c3535f8acead06cbef6dce2a), [`aedf23f85`](https://github.com/withastro/astro/commit/aedf23f8582e32a6b94b81ddba9b323831f2b22a)]:
  - astro@2.0.2

## 6.0.0

### Major Changes

- [#5707](https://github.com/withastro/astro/pull/5707) [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b) Thanks [@bluwy](https://github.com/bluwy)! - Remove `astro:build:start` backwards compatibility code

- [#5806](https://github.com/withastro/astro/pull/5806) [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53) Thanks [@matthewp](https://github.com/matthewp)! - Make astro a `peerDependency` of integrations

  This marks `astro` as a `peerDependency` of several packages that are already getting `major` version bumps. This is so we can more properly track the dependency between them and what version of Astro they are being used with.

### Patch Changes

- Updated dependencies [[`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b), [`16dc36a87`](https://github.com/withastro/astro/commit/16dc36a870df47a4151a8ed2d91d0bd1bb812458), [`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029), [`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144), [`05caf445d`](https://github.com/withastro/astro/commit/05caf445d4d2728f1010aeb2179a9e756c2fd17d), [`49ab4f231`](https://github.com/withastro/astro/commit/49ab4f231c23b34891c3ee86f4b92bf8d6d267a3), [`a342a486c`](https://github.com/withastro/astro/commit/a342a486c2831461e24e6c2f1ca8a9d3e15477b6), [`8fb28648f`](https://github.com/withastro/astro/commit/8fb28648f66629741cb976bfe34ccd9d8f55661e), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63), [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b), [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a), [`ce5c5dbd4`](https://github.com/withastro/astro/commit/ce5c5dbd46afbe738b03600758bf5c35113de522), [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2), [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4), [`259a539d7`](https://github.com/withastro/astro/commit/259a539d7d70c783330c797794b15716921629cf), [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a), [`4987d6f44`](https://github.com/withastro/astro/commit/4987d6f44cfd0d81d88f21f5c380503403dc1e6a), [`304823811`](https://github.com/withastro/astro/commit/304823811eddd8e72aa1d8e2d39b40ab5cda3565), [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5), [`55cea0a9d`](https://github.com/withastro/astro/commit/55cea0a9d8c8df91a46590fc04a9ac28089b3432), [`dd56c1941`](https://github.com/withastro/astro/commit/dd56c19411b126439b8bc42d681b6fa8c06e8c61), [`9963c6e4d`](https://github.com/withastro/astro/commit/9963c6e4d50c392c3d1ac4492237020f15ccb1de), [`be901dc98`](https://github.com/withastro/astro/commit/be901dc98c4a7f6b5536540aa8f7ba5108e939a0), [`f6cf92b48`](https://github.com/withastro/astro/commit/f6cf92b48317a19a3840ad781b77d6d3cae143bb), [`e818cc046`](https://github.com/withastro/astro/commit/e818cc0466a942919ea3c41585e231c8c80cb3d0), [`8c100a6fe`](https://github.com/withastro/astro/commit/8c100a6fe6cc652c3799d1622e12c2c969f30510), [`116d8835c`](https://github.com/withastro/astro/commit/116d8835ca9e78f8b5e477ee5a3d737b69f80706), [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d), [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d), [`7325df412`](https://github.com/withastro/astro/commit/7325df412107fc0e65cd45c1b568fb686708f723), [`16c7d0bfd`](https://github.com/withastro/astro/commit/16c7d0bfd49d2b9bfae45385f506bcd642f9444a), [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d), [`2a5786419`](https://github.com/withastro/astro/commit/2a5786419599b8674473c699300172b9aacbae2e), [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa), [`a8d3e7924`](https://github.com/withastro/astro/commit/a8d3e79246605d252dcddad159e358e2d79bd624), [`fa8c131f8`](https://github.com/withastro/astro/commit/fa8c131f88ef67d14c62f1c00c97ed74d43a80ac), [`64b8082e7`](https://github.com/withastro/astro/commit/64b8082e776b832f1433ed288e6f7888adb626d0), [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481), [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb), [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1), [`a3a7fc929`](https://github.com/withastro/astro/commit/a3a7fc9298e6d88abb4b7bee1e58f05fa9558cf1), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`5fd9208d4`](https://github.com/withastro/astro/commit/5fd9208d447f5ab8909a2188b6c2491a0debd49d), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`899214298`](https://github.com/withastro/astro/commit/899214298cee5f0c975c7245e623c649e1842d73), [`3a00ecb3e`](https://github.com/withastro/astro/commit/3a00ecb3eb4bc44be758c064f2bde6e247e8a593), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0), [`1ca81c16b`](https://github.com/withastro/astro/commit/1ca81c16b8b66236e092e6eb6ec3f73f5668421c), [`b66d7195c`](https://github.com/withastro/astro/commit/b66d7195c17a55ea0931bc3744888bd4f5f01ce6)]:
  - astro@2.0.0

## 6.0.0-beta.1

<details>
<summary>See changes in 6.0.0-beta.1</summary>

### Major Changes

- [#5806](https://github.com/withastro/astro/pull/5806) [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53) Thanks [@matthewp](https://github.com/matthewp)! - Make astro a `peerDependency` of integrations

  This marks `astro` as a `peerDependency` of several packages that are already getting `major` version bumps. This is so we can more properly track the dependency between them and what version of Astro they are being used with.

### Patch Changes

- Updated dependencies [[`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63), [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b), [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a), [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2), [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4), [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a), [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5), [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d), [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d), [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa), [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481), [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb), [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0)]:
  - astro@2.0.0-beta.2

</details>

## 6.0.0-beta.0

<details>
<summary>See changes in 6.0.0-beta.0</summary>

### Major Changes

- [#5707](https://github.com/withastro/astro/pull/5707) [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b) Thanks [@bluwy](https://github.com/bluwy)! - Remove `astro:build:start` backwards compatibility code

### Patch Changes

- Updated dependencies [[`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144), [`8fb28648f`](https://github.com/withastro/astro/commit/8fb28648f66629741cb976bfe34ccd9d8f55661e), [`dd56c1941`](https://github.com/withastro/astro/commit/dd56c19411b126439b8bc42d681b6fa8c06e8c61), [`f6cf92b48`](https://github.com/withastro/astro/commit/f6cf92b48317a19a3840ad781b77d6d3cae143bb), [`16c7d0bfd`](https://github.com/withastro/astro/commit/16c7d0bfd49d2b9bfae45385f506bcd642f9444a), [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b)]:
  - astro@2.0.0-beta.0

</details>

## 5.0.0

### Patch Changes

- Updated dependencies [[`d85ec7484`](https://github.com/withastro/astro/commit/d85ec7484ce14a4c7d3f480da8f38fcb9aff388f), [`d2960984c`](https://github.com/withastro/astro/commit/d2960984c59af7b60a3ea472c6c58fb00534a8e6), [`31ec84797`](https://github.com/withastro/astro/commit/31ec8479721a1cd65538ec041458c5ffe8f50ee9), [`5ec0f6ed5`](https://github.com/withastro/astro/commit/5ec0f6ed55b0a14a9663a90a03428345baf126bd), [`dced4a8a2`](https://github.com/withastro/astro/commit/dced4a8a2657887ec569860d9862d20f695dc23a), [`6b156dd3b`](https://github.com/withastro/astro/commit/6b156dd3b467884839a571c53114aadf26fa4b0b)]:
  - astro@1.7.0

## 4.1.1

### Patch Changes

- [#5534](https://github.com/withastro/astro/pull/5534) [`fabd9124b`](https://github.com/withastro/astro/commit/fabd9124bd3e654e885054f30e9c0d01eabf0470) Thanks [@bluwy](https://github.com/bluwy)! - Update esbuild dependency

- Updated dependencies [[`9082a850e`](https://github.com/withastro/astro/commit/9082a850eef4ab0187fc3bfdd5a377f0c7040070), [`4f7f20616`](https://github.com/withastro/astro/commit/4f7f20616ed2b63f94ebf43bc5fdc1be55062a94), [`05915fec0`](https://github.com/withastro/astro/commit/05915fec01a51f27ab5051644f01e6112ecf06bc), [`1aeabe417`](https://github.com/withastro/astro/commit/1aeabe417077505bc0cdb8d2e47366ddbc616072), [`795f00f73`](https://github.com/withastro/astro/commit/795f00f73c549727e05d5b7bf0e39cce87add4e7), [`2c836b9d1`](https://github.com/withastro/astro/commit/2c836b9d1283a0707128d172e92ee2bba767486c), [`8f3f67c96`](https://github.com/withastro/astro/commit/8f3f67c96aee63be64de77f374293761ff73f6ce)]:
  - astro@1.6.14

## 4.1.0

### Minor Changes

- [#5347](https://github.com/withastro/astro/pull/5347) [`743000cc7`](https://github.com/withastro/astro/commit/743000cc70274a2d2fed01c72e2ac51aa6b876a6) Thanks [@AirBorne04](https://github.com/AirBorne04)! - Now building for Cloudflare directory mode takes advantage of the standard asset handling from Cloudflare Pages, and therefore does not call a function script to deliver static assets anymore.
  Also supports the use of `_routes.json`, `_redirects` and `_headers` files when placed into the `public` folder.

### Patch Changes

- Updated dependencies [[`936c1e411`](https://github.com/withastro/astro/commit/936c1e411d77c69b2b60a061c54704200716800a), [`4b188132e`](https://github.com/withastro/astro/commit/4b188132ef68f8d9951cec86418ef50bb4df4a96), [`f5ed630bc`](https://github.com/withastro/astro/commit/f5ed630bca05ebbfcc6ac994ced3911e41daedcc)]:
  - astro@1.6.11

## 4.0.1

### Patch Changes

- [#5301](https://github.com/withastro/astro/pull/5301) [`a79a37cad`](https://github.com/withastro/astro/commit/a79a37cad549b21f91599ff86899e456d9dcc7df) Thanks [@bluwy](https://github.com/bluwy)! - Fix environment variables usage in worker output and warn if environment variables are accessedd too early

- Updated dependencies [[`88c1bbe3a`](https://github.com/withastro/astro/commit/88c1bbe3a71f85e92f42f13d0f310c6b2a264ade), [`a79a37cad`](https://github.com/withastro/astro/commit/a79a37cad549b21f91599ff86899e456d9dcc7df)]:
  - astro@1.6.5

## 4.0.0

### Major Changes

- [#5290](https://github.com/withastro/astro/pull/5290) [`b2b291d29`](https://github.com/withastro/astro/commit/b2b291d29143703cece0d12c8e74b2e1151d2061) Thanks [@matthewp](https://github.com/matthewp)! - Handle base configuration in adapters

  This allows adapters to correctly handle `base` configuration. Internally Astro now matches routes when the URL includes the `base`.

  Adapters now also have access to the `removeBase` method which will remove the `base` from a pathname. This is useful to look up files for static assets.

### Patch Changes

- Updated dependencies [[`b2b291d29`](https://github.com/withastro/astro/commit/b2b291d29143703cece0d12c8e74b2e1151d2061), [`97e2b6ad7`](https://github.com/withastro/astro/commit/97e2b6ad7a6fa23e82be28b2f57cdf3f85fab112), [`4af4d8fa0`](https://github.com/withastro/astro/commit/4af4d8fa0035130fbf31c82d72777c3679bc1ca5), [`f6add3924`](https://github.com/withastro/astro/commit/f6add3924d5cd59925a6ea4bf7f2f731709bc893), [`247eb7411`](https://github.com/withastro/astro/commit/247eb7411f429317e5cd7d401a6660ee73641313)]:
  - astro@1.6.4

## 3.1.2

### Patch Changes

- [#5230](https://github.com/withastro/astro/pull/5230) [`69a532ab6`](https://github.com/withastro/astro/commit/69a532ab60a85d30c2395969593c4d38f9a2fbbe) Thanks [@matthewp](https://github.com/matthewp)! - Exports new runtime entrypoint's types

## 3.1.1

### Patch Changes

- [#5103](https://github.com/withastro/astro/pull/5103) [`d151d9f3f`](https://github.com/withastro/astro/commit/d151d9f3f29c0a57c59b8029a18717808ccc7f8f) Thanks [@AirBorne04](https://github.com/AirBorne04)! - enable access to Cloudflare runtime [KV, R2, Durable Objects]
  - access native Cloudflare runtime through `import { getRuntime } from "@astrojs/cloudflare/runtime"`; now you can call `getRuntime(Astro.request)` and get access to the runtime environment.

## 3.1.0

### Minor Changes

- [#5056](https://github.com/withastro/astro/pull/5056) [`e55af8a23`](https://github.com/withastro/astro/commit/e55af8a23233b6335f45b7a04b9d026990fb616c) Thanks [@matthewp](https://github.com/matthewp)! - # New build configuration

  The ability to customize SSR build configuration more granularly is now available in Astro. You can now customize the output folder for `server` (the server code for SSR), `client` (your client-side JavaScript and assets), and `serverEntry` (the name of the entrypoint server module). Here are the defaults:

  ```js
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    output: 'server',
    build: {
      server: './dist/server/',
      client: './dist/client/',
      serverEntry: 'entry.mjs',
    },
  });
  ```

  These new configuration options are only supported in SSR mode and are ignored when building to SSG (a static site).

  ## Integration hook change

  The integration hook `astro:build:start` includes a param `buildConfig` which includes all of these same options. You can continue to use this param in Astro 1.x, but it is deprecated in favor of the new `build.config` options. All of the built-in adapters have been updated to the new format. If you have an integration that depends on this param we suggest upgrading to do this instead:

  ```js
  export default function myIntegration() {
    return {
      name: 'my-integration',
      hooks: {
        'astro:config:setup': ({ updateConfig }) => {
          updateConfig({
            build: {
              server: '...',
            },
          });
        },
      },
    };
  }
  ```

## 3.0.0

### Major Changes

- [#4888](https://github.com/withastro/astro/pull/4888) [`2dc582ac5`](https://github.com/withastro/astro/commit/2dc582ac5e2d6e1d434ccfe21616182e453feec3) Thanks [@AirBorne04](https://github.com/AirBorne04)! - adjusting the build settings for cloudflare (reverting back to platform browser over neutral)
  adjusting the ssr settings for solidjs (to build for node)

## 2.1.0

### Minor Changes

- [#4876](https://github.com/withastro/astro/pull/4876) [`d3091f89e`](https://github.com/withastro/astro/commit/d3091f89e92fcfe1ad48daca74055d54b1c853a3) Thanks [@matthewp](https://github.com/matthewp)! - Adds the Astro.cookies API

  `Astro.cookies` is a new API for manipulating cookies in Astro components and API routes.

  In Astro components, the new `Astro.cookies` object is a map-like object that allows you to get, set, delete, and check for a cookie's existence (`has`):

  ```astro
  ---
  type Prefs = {
    darkMode: boolean;
  };

  Astro.cookies.set<Prefs>(
    'prefs',
    { darkMode: true },
    {
      expires: '1 month',
    }
  );

  const prefs = Astro.cookies.get<Prefs>('prefs').json();
  ---

  <body data-theme={prefs.darkMode ? 'dark' : 'light'}></body>
  ```

  Once you've set a cookie with Astro.cookies it will automatically be included in the outgoing response.

  This API is also available with the same functionality in API routes:

  ```js
  export function post({ cookies }) {
    cookies.set('loggedIn', false);

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }
  ```

  See [the RFC](https://github.com/withastro/rfcs/blob/main/proposals/0025-cookie-management.md) to learn more.

## 2.0.0

### Major Changes

- [#4815](https://github.com/withastro/astro/pull/4815) [`ce0b92ba7`](https://github.com/withastro/astro/commit/ce0b92ba73072c0f0143829a53f870155ad4c7ff) Thanks [@AirBorne04](https://github.com/AirBorne04)! - adjusted esbuild config to work with worker environment (fixing solid js ssr)

## 1.0.2

### Patch Changes

- [#4558](https://github.com/withastro/astro/pull/4558) [`742966456`](https://github.com/withastro/astro/commit/7429664566f05ecebf6d57906f950627e62e690c) Thanks [@tony-sull](https://github.com/tony-sull)! - Adding the `withastro` keyword to include the adapters on the [Integrations Catalog](https://astro.build/integrations)

## 1.0.1

### Patch Changes

- [#4232](https://github.com/withastro/astro/pull/4232) [`bfbd32588`](https://github.com/withastro/astro/commit/bfbd32588f7e2c0a9e43cd1a571a0dc9c5f7e645) Thanks [@Ekwuno](https://github.com/Ekwuno)! - Update README

## 1.0.0

### Major Changes

- [`04ad44563`](https://github.com/withastro/astro/commit/04ad445632c67bdd60c1704e1e0dcbcaa27b9308) - > Astro v1.0 is out! Read the [official announcement post](https://astro.build/blog/astro-1/).

  **No breaking changes**. This package is now officially stable and compatible with `astro@1.0.0`!

## 0.5.0

### Minor Changes

- [#3806](https://github.com/withastro/astro/pull/3806) [`f4c571bdb`](https://github.com/withastro/astro/commit/f4c571bdb0bbcd0dfed68a484dfbfe274f8a5f45) Thanks [@nrgnrg](https://github.com/nrgnrg)! - add support for compiling functions to a functions directory rather than `_worker.js`

## 0.4.0

### Minor Changes

- [#4068](https://github.com/withastro/astro/pull/4068) [`54b33d50f`](https://github.com/withastro/astro/commit/54b33d50fdb995ac056461be7e2128d911624f2d) Thanks [@matthewp](https://github.com/matthewp)! - Add explicit errors when omitting output config

### Patch Changes

- [#4072](https://github.com/withastro/astro/pull/4072) [`a198028b0`](https://github.com/withastro/astro/commit/a198028b04234d0b8dcb0b6bcb47c5831d7a15f9) Thanks [@matthewp](https://github.com/matthewp)! - Fixes Cloudflare throwing an error for process

## 0.3.0

### Minor Changes

- [#4015](https://github.com/withastro/astro/pull/4015) [`6fd161d76`](https://github.com/withastro/astro/commit/6fd161d7691cbf9d3ffa4646e46059dfd0940010) Thanks [@matthewp](https://github.com/matthewp)! - New `output` configuration option

  This change introduces a new "output target" configuration option (`output`). Setting the output target lets you decide the format of your final build, either:

  - `"static"` (default): A static site. Your final build will be a collection of static assets (HTML, CSS, JS) that you can deploy to any static site host.
  - `"server"`: A dynamic server application. Your final build will be an application that will run in a hosted server environment, generating HTML dynamically for different requests.

  If `output` is omitted from your config, the default value `"static"` will be used.

  When using the `"server"` output target, you must also include a runtime adapter via the `adapter` configuration. An adapter will _adapt_ your final build to run on the deployed platform of your choice (Netlify, Vercel, Node.js, Deno, etc).

  To migrate: No action is required for most users. If you currently define an `adapter`, you will need to also add `output: 'server'` to your config file to make it explicit that you are building a server. Here is an example of what that change would look like for someone deploying to Netlify:

  ```diff
  import { defineConfig } from 'astro/config';
  import netlify from '@astrojs/netlify/functions';

  export default defineConfig({
    adapter: netlify(),
  + output: 'server',
  });
  ```

* [#4018](https://github.com/withastro/astro/pull/4018) [`0cc6ede36`](https://github.com/withastro/astro/commit/0cc6ede362996b9faba57481a790d6eb7fba2045) Thanks [@okikio](https://github.com/okikio)! - Support for 404 and 500 pages in SSR

- [#3973](https://github.com/withastro/astro/pull/3973) [`5a23483ef`](https://github.com/withastro/astro/commit/5a23483efb3ba614b05a00064f84415620605204) Thanks [@matthewp](https://github.com/matthewp)! - Adds support for Astro.clientAddress

  The new `Astro.clientAddress` property allows you to get the IP address of the requested user.

  ```astro

  ```

  This property is only available when building for SSR, and only if the adapter you are using supports providing the IP address. If you attempt to access the property in a SSG app it will throw an error.

## 0.2.4

### Patch Changes

- [#3885](https://github.com/withastro/astro/pull/3885) [`bf5d1cc1e`](https://github.com/withastro/astro/commit/bf5d1cc1e71da38a14658c615e9481f2145cc6e7) Thanks [@delucis](https://github.com/delucis)! - Integration README fixes

## 0.2.3

### Patch Changes

- [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

## 0.2.2

### Patch Changes

- [#3777](https://github.com/withastro/astro/pull/3777) [`976e1f17`](https://github.com/withastro/astro/commit/976e1f175a95ea39f737b8575e4fdf3c3d89e1ee) Thanks [@tony-sull](https://github.com/tony-sull)! - Disables HTTP streaming in Cloudflare Pages deployments

## 0.2.1

### Patch Changes

- [#3695](https://github.com/withastro/astro/pull/3695) [`0d667d0e`](https://github.com/withastro/astro/commit/0d667d0e572d76d4c819816ddf51ed14b43e2551) Thanks [@nrgnrg](https://github.com/nrgnrg)! - fix custom 404 pages not rendering

## 0.2.0

### Minor Changes

- [#3600](https://github.com/withastro/astro/pull/3600) [`7f423581`](https://github.com/withastro/astro/commit/7f423581411648c9a69b68918ff930581f12cf16) Thanks [@nrgnrg](https://github.com/nrgnrg)! - add SSR adaptor for Cloudflare Pages functions
