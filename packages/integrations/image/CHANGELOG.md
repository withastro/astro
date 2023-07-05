# @astrojs/image

## 0.17.2

### Patch Changes

- [#7500](https://github.com/withastro/astro/pull/7500) [`e644b3465`](https://github.com/withastro/astro/commit/e644b34659836b463abb8c6a0acc867621c2d3cc) Thanks [@wooseopkim](https://github.com/wooseopkim)! - fix: make `Picture` generate valid dev URLs

- [#7510](https://github.com/withastro/astro/pull/7510) [`4256409a9`](https://github.com/withastro/astro/commit/4256409a9414358e4d0adf90599dd5921ed0b450) Thanks [@Mrowa96](https://github.com/Mrowa96)! - Fix problem where image metadata generation throwed error when provided url started with /@astroimage

- Updated dependencies [[`9e2426f75`](https://github.com/withastro/astro/commit/9e2426f75637a6318961f483de90b635f3fdadeb), [`cdc28326c`](https://github.com/withastro/astro/commit/cdc28326cf21f305924363e9c8c02ce54b6ff895), [`19c2d43ea`](https://github.com/withastro/astro/commit/19c2d43ea41efdd8741007de0774e7e394f174b0), [`2172dd4f0`](https://github.com/withastro/astro/commit/2172dd4f0dd8f87d1adbc5ae90f44724e66eb964), [`1170877b5`](https://github.com/withastro/astro/commit/1170877b51aaa13203e8c488dcf4e39d1b5553ee)]:
  - astro@2.7.3

## 0.17.1

### Patch Changes

- [#7340](https://github.com/withastro/astro/pull/7340) [`9739adc91`](https://github.com/withastro/astro/commit/9739adc91f967a59f50dd8c2862e7e4b2bcf74b4) Thanks [@wooseopkim](https://github.com/wooseopkim)! - Fix problem where filenames with spaces produce invalid srcset attributes

- Updated dependencies [[`30bb36371`](https://github.com/withastro/astro/commit/30bb363713e3d2c50d0d4816d970aa93b836a3b0), [`3943fa390`](https://github.com/withastro/astro/commit/3943fa390a0bd41317a673d0f841e0461c7499cd), [`7877a06d8`](https://github.com/withastro/astro/commit/7877a06d829305eed356fbb8bfd1ef578cd5466e), [`e314a04bf`](https://github.com/withastro/astro/commit/e314a04bfbf0526838b7c9aac452251b27d69719), [`33cdc8622`](https://github.com/withastro/astro/commit/33cdc8622a56c8e5465b7a50f627ecc568870c6b), [`76fcdb84d`](https://github.com/withastro/astro/commit/76fcdb84dd828ac373b2dc739e57fadf650820fd), [`8e2923cc6`](https://github.com/withastro/astro/commit/8e2923cc6219eda01ca2c749f5c7fa2fe4319455), [`459b5bd05`](https://github.com/withastro/astro/commit/459b5bd05f562238f7250520efe3cf0fa156bb45)]:
  - astro@2.7.0

## 0.17.0

### Minor Changes

- [#7260](https://github.com/withastro/astro/pull/7260) [`39403c32f`](https://github.com/withastro/astro/commit/39403c32faea58399c61d3344b770f195be60d5b) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Unflags support for `output: 'hybrid'` mode, which enables pre-rendering by default. The additional `experimental.hybridOutput` flag can be safely removed from your configuration.

### Patch Changes

- Updated dependencies [[`57f8d14c0`](https://github.com/withastro/astro/commit/57f8d14c027c30919363e12c664ccff4ed64d0fc), [`414eb19d2`](https://github.com/withastro/astro/commit/414eb19d2fcb55758f9d053076773b11b62f4c97), [`a7e2b37ff`](https://github.com/withastro/astro/commit/a7e2b37ff73871c46895c615846a86a539f45330), [`dd1a6b6c9`](https://github.com/withastro/astro/commit/dd1a6b6c941aeb7af934bd12db22412af262f5a1), [`d72cfa7ca`](https://github.com/withastro/astro/commit/d72cfa7cad758192163712ceb269405659fd14bc), [`144813f73`](https://github.com/withastro/astro/commit/144813f7308dcb9de64ebe3f0f2c6cba9ad81eb1), [`b5213654b`](https://github.com/withastro/astro/commit/b5213654b1b7f3ba573a48d3be688b2bdde7870f), [`e3b8c6296`](https://github.com/withastro/astro/commit/e3b8c62969d680d1915a122c610d281d6711aa63), [`890a2bc98`](https://github.com/withastro/astro/commit/890a2bc9891a2449ab99b01b65468f6dddba6b12), [`39403c32f`](https://github.com/withastro/astro/commit/39403c32faea58399c61d3344b770f195be60d5b), [`101f03209`](https://github.com/withastro/astro/commit/101f032098148b3daaac8d46ff1e535b79232e43)]:
  - astro@2.6.0

## 0.16.9

### Patch Changes

- [#6991](https://github.com/withastro/astro/pull/6991) [`719002ca5`](https://github.com/withastro/astro/commit/719002ca5b128744fb4316d4a52c5dcd46a42759) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - Enable experimental support for hybrid SSR with pre-rendering enabled by default

  **astro.config.mjs**

  ```js
  import { defineConfig } from 'astro/config';
  export defaultdefineConfig({
     output: 'hybrid',
         experimental: {
         hybridOutput: true,
     },
  })
  ```

  Then add `export const prerender =  false` to any page or endpoint you want to opt-out of pre-rendering.

  **src/pages/contact.astro**

  ```astro
  ---
  export const prerender = false;

  if (Astro.request.method === 'POST') {
    // handle form submission
  }
  ---

  <form method="POST">
    <input type="text" name="name" />
    <input type="email" name="email" />
    <button type="submit">Submit</button>
  </form>
  ```

- Updated dependencies [[`4516d7b22`](https://github.com/withastro/astro/commit/4516d7b22c5979cde4537f196b53ae2826ba9561), [`e186ecc5e`](https://github.com/withastro/astro/commit/e186ecc5e292de8c6a2c441a2d588512c0813068), [`c6d7ebefd`](https://github.com/withastro/astro/commit/c6d7ebefdd554a9ef29cfeb426ac55cab80d6473), [`914c439bc`](https://github.com/withastro/astro/commit/914c439bccee9fec002c6d92beaa501c398e62ac), [`e9fc2c221`](https://github.com/withastro/astro/commit/e9fc2c2213036d47cd30a47a6cdad5633481a0f8), [`075eee08f`](https://github.com/withastro/astro/commit/075eee08f2e2b0baea008b97f3523f2cb937ee44), [`719002ca5`](https://github.com/withastro/astro/commit/719002ca5b128744fb4316d4a52c5dcd46a42759), [`fc52681ba`](https://github.com/withastro/astro/commit/fc52681ba2f8fe8bcd92eeedf3c6a52fd86a390e), [`fb84622af`](https://github.com/withastro/astro/commit/fb84622af04f795de8d17f24192de105f70fe910), [`cada10a46`](https://github.com/withastro/astro/commit/cada10a466f81f8edb0aa664f9cffdb6b5b8f307), [`cd410c5eb`](https://github.com/withastro/astro/commit/cd410c5eb71f825259279c27c4c39d0ad282c3f0), [`73ec6f6c1`](https://github.com/withastro/astro/commit/73ec6f6c16cadb71dafe9f664f0debde072c3173), [`410428672`](https://github.com/withastro/astro/commit/410428672ed97bba7ca0b3352c1a7ee564921462), [`763ff2d1e`](https://github.com/withastro/astro/commit/763ff2d1e44f54b899d7c65386f1b4b877c95737), [`c1669c001`](https://github.com/withastro/astro/commit/c1669c0011eecfe65a459d727848c18c189a54ca), [`3d525efc9`](https://github.com/withastro/astro/commit/3d525efc95cfb2deb5d9e04856d02965d66901c9)]:
  - astro@2.5.0

## 0.16.8

### Patch Changes

- [#7059](https://github.com/withastro/astro/pull/7059) [`ebb40f5cb`](https://github.com/withastro/astro/commit/ebb40f5cb093e9be5f856a98bf5ffd65a814218b) Thanks [@jasikpark](https://github.com/jasikpark)! - Add `fetchpriority` to allowed `Picture` attributes in `@astrojs/image`

- Updated dependencies [[`c87d42e76`](https://github.com/withastro/astro/commit/c87d42e766d02db5352671cbf074dd637bdb23e0), [`4f1073a6a`](https://github.com/withastro/astro/commit/4f1073a6a4f3e5a4fc9df96a2ae59f2e929703fe)]:
  - astro@2.4.5

## 0.16.7

### Patch Changes

- [#6969](https://github.com/withastro/astro/pull/6969) [`77270cc2c`](https://github.com/withastro/astro/commit/77270cc2cd06c942d7abf1d882e36d9163edafa5) Thanks [@bluwy](https://github.com/bluwy)! - Avoid removing leading slash for `build.assetsPrefix` value in the build output

- [#6952](https://github.com/withastro/astro/pull/6952) [`e5bd084c0`](https://github.com/withastro/astro/commit/e5bd084c01e4f60a157969b50c05ce002f7b63d2) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update allowed Sharp versions to support 0.32.0

- Updated dependencies [[`a8a319aef`](https://github.com/withastro/astro/commit/a8a319aef744a64647ee16c7d558d74de6864c6c), [`a695e44ae`](https://github.com/withastro/astro/commit/a695e44aed6e2f5d32cb950d4237be6e5657ba98), [`367e61776`](https://github.com/withastro/astro/commit/367e61776196a17d61c28daa4dfbabb6244e040c), [`77270cc2c`](https://github.com/withastro/astro/commit/77270cc2cd06c942d7abf1d882e36d9163edafa5), [`895fa07d8`](https://github.com/withastro/astro/commit/895fa07d8b4b8359984e048daca5437e40f44390), [`72c6bf01f`](https://github.com/withastro/astro/commit/72c6bf01fe49b331ca8ad9206a7506b15caf5b8d), [`e5bd084c0`](https://github.com/withastro/astro/commit/e5bd084c01e4f60a157969b50c05ce002f7b63d2)]:
  - astro@2.3.4

## 0.16.6

### Patch Changes

- [#6773](https://github.com/withastro/astro/pull/6773) [`99479e6b9`](https://github.com/withastro/astro/commit/99479e6b9505dc929997b5c42f4d7b30d54ef074) Thanks [@doganalper](https://github.com/doganalper)! - Make sizes prop optional on Image component

- Updated dependencies [[`60c16db6f`](https://github.com/withastro/astro/commit/60c16db6ff583b0656bc1937814c8bbf06831294), [`c12ca5ece`](https://github.com/withastro/astro/commit/c12ca5ece34beef0fb53f911515a7c752cc2f3ad)]:
  - astro@2.2.2

## 0.16.5

### Patch Changes

- [#6714](https://github.com/withastro/astro/pull/6714) [`ff0430786`](https://github.com/withastro/astro/commit/ff043078630e678348ae4f4757b3015b3b862c16) Thanks [@bluwy](https://github.com/bluwy)! - Add `build.assetsPrefix` option for CDN support. If set, all Astro-generated asset links will be prefixed with it. For example, setting it to `https://cdn.example.com` would generate `https://cdn.example.com/_astro/penguin.123456.png` links.

  Also adds `import.meta.env.ASSETS_PREFIX` environment variable that can be used to manually create asset links not handled by Astro.

- Updated dependencies [[`489dd8d69`](https://github.com/withastro/astro/commit/489dd8d69cdd9d7c243cf8bec96051a914984b9c), [`a1a4f45b5`](https://github.com/withastro/astro/commit/a1a4f45b51a80215fa7598da83bd0d9c5acd20d2), [`a1108e037`](https://github.com/withastro/astro/commit/a1108e037115cdb67d03505286c7d3a4fc2a1ff5), [`8b88e4cf1`](https://github.com/withastro/astro/commit/8b88e4cf15c8bea7942b3985380164e0edf7250b), [`d54cbe413`](https://github.com/withastro/astro/commit/d54cbe41349e55f8544212ad9320705f07325920), [`4c347ab51`](https://github.com/withastro/astro/commit/4c347ab51e46f2319d614f8577fe502e3dc816e2), [`ff0430786`](https://github.com/withastro/astro/commit/ff043078630e678348ae4f4757b3015b3b862c16), [`2f2e572e9`](https://github.com/withastro/astro/commit/2f2e572e937fd25451bbc78a05d55b7caa1ca3ec), [`7116c021a`](https://github.com/withastro/astro/commit/7116c021a39eac15a6e1264dfbd11bef0f5d618a)]:
  - astro@2.2.0

## 0.16.4

### Patch Changes

- [#6701](https://github.com/withastro/astro/pull/6701) [`46ecf4662`](https://github.com/withastro/astro/commit/46ecf466281450caedff5915cecde7a9fe3fdde0) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Remove unnecessary `.wasm` files inside build output when possible

- Updated dependencies [[`c0b7864a4`](https://github.com/withastro/astro/commit/c0b7864a41dd9f31e5a588208d1ff806d4edf047), [`5e33c51a9`](https://github.com/withastro/astro/commit/5e33c51a9c3c3b731a33f2c4a020a36d1471b78b), [`c2d4ae1cb`](https://github.com/withastro/astro/commit/c2d4ae1cbed622b2fadeb1fe8cc8bbed5f5adc8f), [`08e92f4f8`](https://github.com/withastro/astro/commit/08e92f4f8ece50e377af5b0caca4ad789e0f23c1), [`f0b732d32`](https://github.com/withastro/astro/commit/f0b732d326c609208f30485b9805a84a321a870e), [`a0bdf4ce2`](https://github.com/withastro/astro/commit/a0bdf4ce2f36a0ce7045dc9f96c15dc7d9204c47), [`c04ea0d43`](https://github.com/withastro/astro/commit/c04ea0d43cc2aa8ebe520a1def19dd89828cf662), [`46ecf4662`](https://github.com/withastro/astro/commit/46ecf466281450caedff5915cecde7a9fe3fdde0)]:
  - astro@2.1.9

## 0.16.3

### Patch Changes

- [#6680](https://github.com/withastro/astro/pull/6680) [`386336441`](https://github.com/withastro/astro/commit/386336441ad70017eea22db0683591126131db21) Thanks [@koriwi](https://github.com/koriwi)! - Invalidates cache when changing serviceEntryPoint

- Updated dependencies [[`1f783e320`](https://github.com/withastro/astro/commit/1f783e32075c20b13063599696644f5d47b75d8d), [`2e92e9aa9`](https://github.com/withastro/astro/commit/2e92e9aa976735c3ddb647152bb9c4850136e386), [`adecda7d6`](https://github.com/withastro/astro/commit/adecda7d6009793c5d20519a997e3b7afb08ad57), [`386336441`](https://github.com/withastro/astro/commit/386336441ad70017eea22db0683591126131db21), [`7c439868a`](https://github.com/withastro/astro/commit/7c439868a3bc7d466418da9af669966014f3d9fe), [`25cd3e574`](https://github.com/withastro/astro/commit/25cd3e574999c1c7294a089ad8c39df27ccdbf17), [`4bf87c64f`](https://github.com/withastro/astro/commit/4bf87c64ff7e9ca49e0f5c27e06bd49faaf60542), [`fc0ed9c53`](https://github.com/withastro/astro/commit/fc0ed9c53cd374860bbdb2503318a55ca09a2662)]:
  - astro@2.1.8

## 0.16.2

### Patch Changes

- [#6548](https://github.com/withastro/astro/pull/6548) [`4685f5554`](https://github.com/withastro/astro/commit/4685f55549da418137ecf1a99e9cd36b3ad08c8c) Thanks [@matthewp](https://github.com/matthewp)! - Use base64 encoded modules for Squoosh integration

  This moves `@astrojs/image` to use base64 encoded versions of the Squoosh wasm modules. This is in order to prevent breakage in SSR environments where your files are moved around. This will fix usage of the integration in Netlify.

- Updated dependencies [[`9caf2a9cc`](https://github.com/withastro/astro/commit/9caf2a9ccc2fd59af5cb2bb7ede9399fc491d38b), [`d338b6f74`](https://github.com/withastro/astro/commit/d338b6f74a3e34b494be85d24739bec9b2566faf)]:
  - astro@2.1.6

## 0.16.1

### Patch Changes

- [#6494](https://github.com/withastro/astro/pull/6494) [`a13e9d7e3`](https://github.com/withastro/astro/commit/a13e9d7e33baccf51e7d4815f99b481ad174bc57) Thanks [@Yan-Thomas](https://github.com/Yan-Thomas)! - Consistency improvements to several package descriptions

- Updated dependencies [[`acf78c5e2`](https://github.com/withastro/astro/commit/acf78c5e271ec3d4f589782078e2a2044cc1c391), [`04e624d06`](https://github.com/withastro/astro/commit/04e624d062c6ce385f6293afba26f3942c2290c6), [`cc90d7219`](https://github.com/withastro/astro/commit/cc90d72197e1139195e9545105b9a1d339f38e1b), [`a9a6ae298`](https://github.com/withastro/astro/commit/a9a6ae29812339ea00f3b9afd3de09bd9d3733a9), [`6a7cf0712`](https://github.com/withastro/astro/commit/6a7cf0712da23e2c095f4bc4f2512e618bceb38e), [`bfd67ea74`](https://github.com/withastro/astro/commit/bfd67ea749dbc6ffa7c9a671fcc48bea6c04a075), [`f6eddffa0`](https://github.com/withastro/astro/commit/f6eddffa0414d54767e9f9e1ee5a936b8a20146b), [`c63874090`](https://github.com/withastro/astro/commit/c6387409062f1d7c2afc93319748ad57086837c5), [`d637d1ea5`](https://github.com/withastro/astro/commit/d637d1ea5b347b9c724adc895c9006c696ac8fc8), [`637f9bc72`](https://github.com/withastro/astro/commit/637f9bc728ea7d56fc82a862d761385f0dcd9528), [`77a046e88`](https://github.com/withastro/astro/commit/77a046e886c370b737208574b6934f5a1cf2b177)]:
  - astro@2.1.3

## 0.16.0

### Minor Changes

- [#6213](https://github.com/withastro/astro/pull/6213) [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Updated compilation settings to disable downlevelling for Node 14

### Patch Changes

- [#6421](https://github.com/withastro/astro/pull/6421) [`e58a92527`](https://github.com/withastro/astro/commit/e58a92527f54cb29d3515d544fad833a5ce1061d) Thanks [@vtavernier](https://github.com/vtavernier)! - Handle missing trailing slash in processStaticImage

- Updated dependencies [[`fec583909`](https://github.com/withastro/astro/commit/fec583909ab62829dc0c1600e2387979365f2b94), [`b087b83fe`](https://github.com/withastro/astro/commit/b087b83fe266c431fe34a07d5c2293cc4ab011c6), [`694918a56`](https://github.com/withastro/astro/commit/694918a56b01104831296be0c25456135a63c784), [`a20610609`](https://github.com/withastro/astro/commit/a20610609863ae3b48afe96819b8f11ae4f414d5), [`a4a74ab70`](https://github.com/withastro/astro/commit/a4a74ab70cd2aa0d812a1f6b202c4e240a8913bf), [`75921b3cd`](https://github.com/withastro/astro/commit/75921b3cd916d439f6392c487c21532fde35ed13), [`afbbc4d5b`](https://github.com/withastro/astro/commit/afbbc4d5bfafc1779bac00b41c2a1cb1c90f2808)]:
  - astro@2.1.0

## 0.15.1

### Patch Changes

- [#6347](https://github.com/withastro/astro/pull/6347) [`504c7bacb`](https://github.com/withastro/astro/commit/504c7bacb8c1f2308a31e6c412825ba34983ba33) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix internal `getSetCookie` usage for `undici@5.20.x`

- Updated dependencies [[`5e26bc891`](https://github.com/withastro/astro/commit/5e26bc891cbebb3598acfa760c135a25c548d624), [`a156ecbb7`](https://github.com/withastro/astro/commit/a156ecbb7f4df6a46124a9a12eb712f9163db2ed), [`ccd72e6bb`](https://github.com/withastro/astro/commit/ccd72e6bb41e570d42b1b158e8124c8e04a1943d), [`504c7bacb`](https://github.com/withastro/astro/commit/504c7bacb8c1f2308a31e6c412825ba34983ba33), [`63dda6ded`](https://github.com/withastro/astro/commit/63dda6dedd4c6ea1d5ce72e9cf3fe5f88339a927), [`f91a7f376`](https://github.com/withastro/astro/commit/f91a7f376c223f18b4d8fbed81f95f6bea1cef8d)]:
  - astro@2.0.15

## 0.15.0

### Minor Changes

- [#6118](https://github.com/withastro/astro/pull/6118) [`ac3649bb5`](https://github.com/withastro/astro/commit/ac3649bb589a3ee1deab4ba73c06a36a45e2cee5) Thanks [@ggounot](https://github.com/ggounot)! - Add support for SVG images

### Patch Changes

- Updated dependencies [[`deacd5443`](https://github.com/withastro/astro/commit/deacd5443aae8d0ee6508e2c442783dcc2e9a014), [`1c678f7eb`](https://github.com/withastro/astro/commit/1c678f7ebff6b8ea843bf4b49ab73ca942a2a755), [`c397be324`](https://github.com/withastro/astro/commit/c397be324f97bb9700da8cd6d845470530b7d18c)]:
  - astro@2.0.12

## 0.14.1

### Patch Changes

- [#6142](https://github.com/withastro/astro/pull/6142) [`9fdecb560`](https://github.com/withastro/astro/commit/9fdecb5606f14d277f56b58f3d06d7ad6c0c515c) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - Improve type definitions (`background` should be optional)

- [#6157](https://github.com/withastro/astro/pull/6157) [`460f9e732`](https://github.com/withastro/astro/commit/460f9e7329482429172883e99dcee95a3a9fb1a5) Thanks [@chasm](https://github.com/chasm)! - Fix duplicate `alt` attribute on Picture component.

- Updated dependencies [[`f6fc662c3`](https://github.com/withastro/astro/commit/f6fc662c3c59d164584c6287a930fcd1c9086ee6), [`592386b75`](https://github.com/withastro/astro/commit/592386b75541f3b7f7d95c631f86024b7e2d314d), [`1b591a143`](https://github.com/withastro/astro/commit/1b591a1431b44eacd239ed8f76809916cabca1db), [`bf8d7366a`](https://github.com/withastro/astro/commit/bf8d7366acb57e1b21181cc40fff55a821d8119e), [`ec38a8921`](https://github.com/withastro/astro/commit/ec38a8921f02a275949abcababe1b8afdf8184a2), [`f20a85b64`](https://github.com/withastro/astro/commit/f20a85b642994f240d8c94260fc55ffa1fd14294), [`9f22ac3d0`](https://github.com/withastro/astro/commit/9f22ac3d097ef2cb3b2bbe5343b8a8a49d83425d), [`cee70f5c6`](https://github.com/withastro/astro/commit/cee70f5c6ac9b0d2edc1f8a6f8f5043605576026), [`ac7fb04d6`](https://github.com/withastro/astro/commit/ac7fb04d6b162f28a337918138d5737e2c0fffad), [`d1f5611fe`](https://github.com/withastro/astro/commit/d1f5611febfd020cca4078c71bafe599015edd16), [`2189170be`](https://github.com/withastro/astro/commit/2189170be523f74f244e84ccab22c655219773ce), [`32abe49bd`](https://github.com/withastro/astro/commit/32abe49bd073417b480b1b990f432a837c12eb6f)]:
  - astro@2.0.7

## 0.14.0

### Minor Changes

- [#5932](https://github.com/withastro/astro/pull/5932) [`b3e65991f`](https://github.com/withastro/astro/commit/b3e65991f731f5320ba5826c731934a8e8482493) Thanks [@rasendubi](https://github.com/rasendubi)! - Allow images from outside srcDir

### Patch Changes

- [#5894](https://github.com/withastro/astro/pull/5894) [`ca91976ed`](https://github.com/withastro/astro/commit/ca91976edbfd34adbb31096516a266f31d8f6216) Thanks [@ralacerda](https://github.com/ralacerda)! - `getPicture()` return object with the correct image type

- Updated dependencies [[`9793f19ec`](https://github.com/withastro/astro/commit/9793f19ecd4e64cbf3140454fe52aeee2c22c8c9), [`f91615f5c`](https://github.com/withastro/astro/commit/f91615f5c04fde36f115dad9110dd75254efd61d), [`2fb72c887`](https://github.com/withastro/astro/commit/2fb72c887f71c0a69ab512870d65b8c867774766)]:
  - astro@2.0.5

## 0.13.1

### Patch Changes

- [#5478](https://github.com/withastro/astro/pull/5478) [`1c7eef308`](https://github.com/withastro/astro/commit/1c7eef308e808aa5ed4662b53e67ec8d1b814d1f) Thanks [@nemo0](https://github.com/nemo0)! - Update READMEs for consistency

- [#6008](https://github.com/withastro/astro/pull/6008) [`9c298aa5a`](https://github.com/withastro/astro/commit/9c298aa5ae235e8b2555f26b1f19394aaab55da8) Thanks [@jasikpark](https://github.com/jasikpark)! - Updated error message for missing `widths` prop to provide an example

- [#6008](https://github.com/withastro/astro/pull/6008) [`9c298aa5a`](https://github.com/withastro/astro/commit/9c298aa5ae235e8b2555f26b1f19394aaab55da8) Thanks [@jasikpark](https://github.com/jasikpark)! - Allow passing `undefined` to TransformOptions, this is a types fix for users with `exactOptionalTypes` enabled in their tsconfig

- Updated dependencies [[`b4432cd6b`](https://github.com/withastro/astro/commit/b4432cd6b65bad685a99fe15867710b0663c13b2), [`98a4a914b`](https://github.com/withastro/astro/commit/98a4a914bc47f3da2764b3bdc01577d25fe2e261), [`071e1dee7`](https://github.com/withastro/astro/commit/071e1dee7e1943be67d1ded39a9af1b7a2aafd02), [`322e059d0`](https://github.com/withastro/astro/commit/322e059d0da9ab0d6a546a111fabda755bd5f1b6), [`b994f6f35`](https://github.com/withastro/astro/commit/b994f6f35e29b2d93ff8ddc281a69c0af3cc3edf), [`12c68343c`](https://github.com/withastro/astro/commit/12c68343c0aa891037d39d3c9b9378b004be6642)]:
  - astro@2.0.3

## 0.13.0

### Minor Changes

- [#5584](https://github.com/withastro/astro/pull/5584) [`9963c6e4d`](https://github.com/withastro/astro/commit/9963c6e4d50c392c3d1ac4492237020f15ccb1de) & [#5842](https://github.com/withastro/astro/pull/5842) [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481) Thanks [@wulinsheng123](https://github.com/wulinsheng123) and [@natemoo-re](https://github.com/natemoo-re)! - **Breaking Change**: client assets are built to an `_astro` directory in the build output directory. Previously these were built to various locations, including `assets/`, `chunks/` and the root of build output.

  You can control this location with the new `build` configuration option named `assets`.

- [#5707](https://github.com/withastro/astro/pull/5707) [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b) Thanks [@bluwy](https://github.com/bluwy)! - Remove `astro:build:start` backwards compatibility code

- [#5806](https://github.com/withastro/astro/pull/5806) [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53) Thanks [@matthewp](https://github.com/matthewp)! - Make astro a peerDependency of integrations

  This marks `astro` as a peerDependency of several packages that are already getting `major` version bumps. This is so we can more properly track the dependency between them and what version of Astro they are being used with.

### Patch Changes

- [#5930](https://github.com/withastro/astro/pull/5930) [`46ecd5de3`](https://github.com/withastro/astro/commit/46ecd5de34df619e2ee73ccea39a57acd37bc0b8) Thanks [@h3y6e](https://github.com/h3y6e)! - Update magic-string from 0.25.9 to 0.27.0

- [#5788](https://github.com/withastro/astro/pull/5788) [`006405d33`](https://github.com/withastro/astro/commit/006405d33c2b8eb1307cb84161659428e43efa51) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - - Refactor types to support props auto-completion for the `Image` and `Picture` components.

  - Pass previously missing `alt` prop to the `getPicture` function

- [#5871](https://github.com/withastro/astro/pull/5871) [`1bd42c6b2`](https://github.com/withastro/astro/commit/1bd42c6b2a072210411cffb42dcc80170b9a618b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix the integration failing to work properly on Node 18+

- [#5888](https://github.com/withastro/astro/pull/5888) [`35b26f377`](https://github.com/withastro/astro/commit/35b26f377f9f379207fb4b5c16877bad1661ac6b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix crash on Netlify Functions due to `import.meta.url`

- Updated dependencies [[`93e633922`](https://github.com/withastro/astro/commit/93e633922c2e449df3bb2357b3683af1d3c0e07b), [`16dc36a87`](https://github.com/withastro/astro/commit/16dc36a870df47a4151a8ed2d91d0bd1bb812458), [`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029), [`e2019be6f`](https://github.com/withastro/astro/commit/e2019be6ffa46fa33d92cfd346f9ecbe51bb7144), [`05caf445d`](https://github.com/withastro/astro/commit/05caf445d4d2728f1010aeb2179a9e756c2fd17d), [`49ab4f231`](https://github.com/withastro/astro/commit/49ab4f231c23b34891c3ee86f4b92bf8d6d267a3), [`a342a486c`](https://github.com/withastro/astro/commit/a342a486c2831461e24e6c2f1ca8a9d3e15477b6), [`8fb28648f`](https://github.com/withastro/astro/commit/8fb28648f66629741cb976bfe34ccd9d8f55661e), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63), [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b), [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a), [`ce5c5dbd4`](https://github.com/withastro/astro/commit/ce5c5dbd46afbe738b03600758bf5c35113de522), [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2), [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4), [`259a539d7`](https://github.com/withastro/astro/commit/259a539d7d70c783330c797794b15716921629cf), [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a), [`4987d6f44`](https://github.com/withastro/astro/commit/4987d6f44cfd0d81d88f21f5c380503403dc1e6a), [`304823811`](https://github.com/withastro/astro/commit/304823811eddd8e72aa1d8e2d39b40ab5cda3565), [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5), [`55cea0a9d`](https://github.com/withastro/astro/commit/55cea0a9d8c8df91a46590fc04a9ac28089b3432), [`dd56c1941`](https://github.com/withastro/astro/commit/dd56c19411b126439b8bc42d681b6fa8c06e8c61), [`9963c6e4d`](https://github.com/withastro/astro/commit/9963c6e4d50c392c3d1ac4492237020f15ccb1de), [`be901dc98`](https://github.com/withastro/astro/commit/be901dc98c4a7f6b5536540aa8f7ba5108e939a0), [`f6cf92b48`](https://github.com/withastro/astro/commit/f6cf92b48317a19a3840ad781b77d6d3cae143bb), [`e818cc046`](https://github.com/withastro/astro/commit/e818cc0466a942919ea3c41585e231c8c80cb3d0), [`8c100a6fe`](https://github.com/withastro/astro/commit/8c100a6fe6cc652c3799d1622e12c2c969f30510), [`116d8835c`](https://github.com/withastro/astro/commit/116d8835ca9e78f8b5e477ee5a3d737b69f80706), [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d), [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d), [`7325df412`](https://github.com/withastro/astro/commit/7325df412107fc0e65cd45c1b568fb686708f723), [`16c7d0bfd`](https://github.com/withastro/astro/commit/16c7d0bfd49d2b9bfae45385f506bcd642f9444a), [`a9c292026`](https://github.com/withastro/astro/commit/a9c2920264e36cc5dc05f4adc1912187979edb0d), [`2a5786419`](https://github.com/withastro/astro/commit/2a5786419599b8674473c699300172b9aacbae2e), [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa), [`a8d3e7924`](https://github.com/withastro/astro/commit/a8d3e79246605d252dcddad159e358e2d79bd624), [`fa8c131f8`](https://github.com/withastro/astro/commit/fa8c131f88ef67d14c62f1c00c97ed74d43a80ac), [`64b8082e7`](https://github.com/withastro/astro/commit/64b8082e776b832f1433ed288e6f7888adb626d0), [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481), [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb), [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1), [`a3a7fc929`](https://github.com/withastro/astro/commit/a3a7fc9298e6d88abb4b7bee1e58f05fa9558cf1), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`5fd9208d4`](https://github.com/withastro/astro/commit/5fd9208d447f5ab8909a2188b6c2491a0debd49d), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`899214298`](https://github.com/withastro/astro/commit/899214298cee5f0c975c7245e623c649e1842d73), [`3a00ecb3e`](https://github.com/withastro/astro/commit/3a00ecb3eb4bc44be758c064f2bde6e247e8a593), [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b), [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0), [`1ca81c16b`](https://github.com/withastro/astro/commit/1ca81c16b8b66236e092e6eb6ec3f73f5668421c), [`b66d7195c`](https://github.com/withastro/astro/commit/b66d7195c17a55ea0931bc3744888bd4f5f01ce6)]:
  - astro@2.0.0

## 0.12.2-beta.1

### Patch Changes

- [#5930](https://github.com/withastro/astro/pull/5930) [`46ecd5de3`](https://github.com/withastro/astro/commit/46ecd5de34df619e2ee73ccea39a57acd37bc0b8) Thanks [@h3y6e](https://github.com/h3y6e)! - Update magic-string from 0.25.9 to 0.27.0

- Updated dependencies [[`4987d6f44`](https://github.com/withastro/astro/commit/4987d6f44cfd0d81d88f21f5c380503403dc1e6a), [`304823811`](https://github.com/withastro/astro/commit/304823811eddd8e72aa1d8e2d39b40ab5cda3565), [`7325df412`](https://github.com/withastro/astro/commit/7325df412107fc0e65cd45c1b568fb686708f723), [`a8d3e7924`](https://github.com/withastro/astro/commit/a8d3e79246605d252dcddad159e358e2d79bd624), [`5fd9208d4`](https://github.com/withastro/astro/commit/5fd9208d447f5ab8909a2188b6c2491a0debd49d)]:
  - astro@2.0.0-beta.4

## 0.12.2-beta.0

### Patch Changes

- [#5788](https://github.com/withastro/astro/pull/5788) [`006405d33`](https://github.com/withastro/astro/commit/006405d33c2b8eb1307cb84161659428e43efa51) Thanks [@MoustaphaDev](https://github.com/MoustaphaDev)! - - Refactor types to support props auto-completion for the `Image` and `Picture` components.

  - Pass previously missing `alt` prop to the `getPicture` function

- [#5871](https://github.com/withastro/astro/pull/5871) [`1bd42c6b2`](https://github.com/withastro/astro/commit/1bd42c6b2a072210411cffb42dcc80170b9a618b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix the integration failing to work properly on Node 18+

- [#5888](https://github.com/withastro/astro/pull/5888) [`35b26f377`](https://github.com/withastro/astro/commit/35b26f377f9f379207fb4b5c16877bad1661ac6b) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix crash on Netlify Functions due to `import.meta.url`

- Updated dependencies [[`16dc36a87`](https://github.com/withastro/astro/commit/16dc36a870df47a4151a8ed2d91d0bd1bb812458), [`05caf445d`](https://github.com/withastro/astro/commit/05caf445d4d2728f1010aeb2179a9e756c2fd17d), [`a342a486c`](https://github.com/withastro/astro/commit/a342a486c2831461e24e6c2f1ca8a9d3e15477b6), [`ce5c5dbd4`](https://github.com/withastro/astro/commit/ce5c5dbd46afbe738b03600758bf5c35113de522), [`be901dc98`](https://github.com/withastro/astro/commit/be901dc98c4a7f6b5536540aa8f7ba5108e939a0), [`e818cc046`](https://github.com/withastro/astro/commit/e818cc0466a942919ea3c41585e231c8c80cb3d0), [`8c100a6fe`](https://github.com/withastro/astro/commit/8c100a6fe6cc652c3799d1622e12c2c969f30510), [`64b8082e7`](https://github.com/withastro/astro/commit/64b8082e776b832f1433ed288e6f7888adb626d0), [`899214298`](https://github.com/withastro/astro/commit/899214298cee5f0c975c7245e623c649e1842d73), [`3a00ecb3e`](https://github.com/withastro/astro/commit/3a00ecb3eb4bc44be758c064f2bde6e247e8a593), [`1ca81c16b`](https://github.com/withastro/astro/commit/1ca81c16b8b66236e092e6eb6ec3f73f5668421c), [`b66d7195c`](https://github.com/withastro/astro/commit/b66d7195c17a55ea0931bc3744888bd4f5f01ce6)]:
  - astro@2.0.0-beta.3

## 1.0.0-beta.2

### Major Changes

- [#5842](https://github.com/withastro/astro/pull/5842) [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481) Thanks [@natemoo-re](https://github.com/natemoo-re)! - **Breaking Change**: client assets are built to an `_astro` directory in the build output directory. Previously these were built to various locations, including `assets/`, `chunks/` and the root of build output.

  You can control this location with the new `build` configuration option named `assets`.

### Minor Changes

- [#5806](https://github.com/withastro/astro/pull/5806) [`7572f7402`](https://github.com/withastro/astro/commit/7572f7402238da37de748be58d678fedaf863b53) Thanks [@matthewp](https://github.com/matthewp)! - Make astro a peerDependency of integrations

  This marks `astro` as a peerDependency of several packages that are already getting `major` version bumps. This is so we can more properly track the dependency between them and what version of Astro they are being used with.

### Patch Changes

- Updated dependencies [[`01f3f463b`](https://github.com/withastro/astro/commit/01f3f463bf2918b310d130a9fabbf3ee21d14029), [`1f92d64ea`](https://github.com/withastro/astro/commit/1f92d64ea35c03fec43aff64eaf704dc5a9eb30a), [`c2180746b`](https://github.com/withastro/astro/commit/c2180746b4f6d9ef1b6f86924f21f52cc6ab4e63), [`ae8a012a7`](https://github.com/withastro/astro/commit/ae8a012a7b6884a03c50494332ee37b4505c2c3b), [`cf2de5422`](https://github.com/withastro/astro/commit/cf2de5422c26bfdea4c75f76e57b57299ded3e3a), [`ec09bb664`](https://github.com/withastro/astro/commit/ec09bb6642064dbd7d2f3369afb090363ae18de2), [`665a2c222`](https://github.com/withastro/astro/commit/665a2c2225e42881f5a9550599e8f3fc1deea0b4), [`f7aa1ec25`](https://github.com/withastro/astro/commit/f7aa1ec25d1584f7abd421903fbef66b1c050e2a), [`302e0ef8f`](https://github.com/withastro/astro/commit/302e0ef8f5d5232e3348afe680e599f3e537b5c5), [`840412128`](https://github.com/withastro/astro/commit/840412128b00a04515156e92c314a929d6b94f6d), [`1f49cddf9`](https://github.com/withastro/astro/commit/1f49cddf9e9ffc651efc171b2cbde9fbe9e8709d), [`4a1cabfe6`](https://github.com/withastro/astro/commit/4a1cabfe6b9ef8a6fbbcc0727a0dc6fa300cedaa), [`c4b0cb8bf`](https://github.com/withastro/astro/commit/c4b0cb8bf2b41887d9106440bb2e70d421a5f481), [`23dc9ea96`](https://github.com/withastro/astro/commit/23dc9ea96a10343852d965efd41fe6665294f1fb), [`63a6ceb38`](https://github.com/withastro/astro/commit/63a6ceb38d88331451dca64d0034c7c58e3d26f1), [`52209ca2a`](https://github.com/withastro/astro/commit/52209ca2ad72a30854947dcb3a90ab4db0ac0a6f), [`2303f9514`](https://github.com/withastro/astro/commit/2303f95142aa740c99213a098f82b99dd37d74a0)]:
  - astro@2.0.0-beta.2

## 0.13.0-beta.0

### Minor Changes

- [#5707](https://github.com/withastro/astro/pull/5707) [`5eba34fcc`](https://github.com/withastro/astro/commit/5eba34fcc663def20bdf6e0daad02a6a5472776b) Thanks [@bluwy](https://github.com/bluwy)! - Remove `astro:build:start` backwards compatibility code

## 0.12.1

### Patch Changes

- [#5521](https://github.com/withastro/astro/pull/5521) [`65d27666e`](https://github.com/withastro/astro/commit/65d27666e1a0e668d02f7106e89f6d7b45f5de02) Thanks [@truesri](https://github.com/truesri)! - Allows passing alt to getPicture

## 0.12.0

### Minor Changes

- [#5474](https://github.com/withastro/astro/pull/5474) [`299ae9bb6`](https://github.com/withastro/astro/commit/299ae9bb6a84e178e742cceb20d87190e64653fc) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - added a warning if the image was GIF

## 0.11.6

### Patch Changes

- [#5393](https://github.com/withastro/astro/pull/5393) [`e2fb0c4ff`](https://github.com/withastro/astro/commit/e2fb0c4ff29d27bbd39193127c64fd4f312129e3) Thanks [@wulinsheng123](https://github.com/wulinsheng123)! - Log error if failed to fetch remote image

## 0.11.5

### Patch Changes

- [#5361](https://github.com/withastro/astro/pull/5361) [`ee750087c`](https://github.com/withastro/astro/commit/ee750087ce360c54d349f160d84bbdafb0ec83b4) Thanks [@matthewp](https://github.com/matthewp)! - Allows @astrojs/image to be used in Vercel SSR

## 0.11.4

### Patch Changes

- [#5360](https://github.com/withastro/astro/pull/5360) [`20e60c6e0`](https://github.com/withastro/astro/commit/20e60c6e0857f7b6938494df6027e8c1ad74cdc1) Thanks [@matthewp](https://github.com/matthewp)! - Fixes regression with local builds

## 0.11.3

### Patch Changes

- [#5324](https://github.com/withastro/astro/pull/5324) [`dc00ca464`](https://github.com/withastro/astro/commit/dc00ca464865feccd3760b54e0ccc58dbc1e804d) Thanks [@bluwy](https://github.com/bluwy)! - Share fallback img src with source of Picture component

## 0.11.2

### Patch Changes

- [#5317](https://github.com/withastro/astro/pull/5317) [`d701ae074`](https://github.com/withastro/astro/commit/d701ae074a4a5c7a5891e31ca50d7c51f56b353c) Thanks [@matthewp](https://github.com/matthewp)! - Fixes use of image worker pool in SSR environments

## 0.11.1

### Patch Changes

- [#5260](https://github.com/withastro/astro/pull/5260) [`37d664e26`](https://github.com/withastro/astro/commit/37d664e26262f8e1026a31dcd4fcb251097dd90c) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes a bug where the `web-streams-polyfill` dependency would not be installed with the `--production` flag

## 0.11.0

### Minor Changes

- [#5180](https://github.com/withastro/astro/pull/5180) [`b77200f42`](https://github.com/withastro/astro/commit/b77200f42399ea31b0045bc0e6bfe2c1c5ccc970) Thanks [@tony-sull](https://github.com/tony-sull)! - Removes the `content-visibility: auto` styling added by the `<Picture />` and `<Image />` components.

  **Why:** The [content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) style is rarely needed for an `<img>` and can actually break certain layouts.

  **Migration:** Do images in your layout actually depend on `content-visibility`? No problem! You can add these styles where needed in your own component styles.

- [#5038](https://github.com/withastro/astro/pull/5038) [`ed2dfdae5`](https://github.com/withastro/astro/commit/ed2dfdae5bea93746be883bc528c1fb6407af6eb) Thanks [@emmanuelchucks](https://github.com/emmanuelchucks)! - HTML attributes included on the `<Picture />` component are now passed down to the underlying `<img />` element.

  **Why?**

  - when styling a `<picture>` the `class` and `style` attributes belong on the `<img>` itself
  - `<picture>` elements [should not](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture#attributes) actually provide any `aria-` attributes
  - `width` and `height` can be added to the `<img>` to help prevent layout shift

## 0.10.0

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

### Patch Changes

- [#5073](https://github.com/withastro/astro/pull/5073) [`93f72f90b`](https://github.com/withastro/astro/commit/93f72f90bc8b29b1bf1402354f1ed6a110411243) Thanks [@bluwy](https://github.com/bluwy)! - Fix image external config in build

- [#5072](https://github.com/withastro/astro/pull/5072) [`3918787cb`](https://github.com/withastro/astro/commit/3918787cb9676a8c6b9be371ae90edeb676f4e8f) Thanks [@bluwy](https://github.com/bluwy)! - Support relative protocol image URL

## 0.9.3

### Patch Changes

- [#5021](https://github.com/withastro/astro/pull/5021) [`062335dbf`](https://github.com/withastro/astro/commit/062335dbf7300ad5370e29ebcf7a05d5a4703a1c) Thanks [@matthewp](https://github.com/matthewp)! - Fix remote images in SSG mode

- [#5034](https://github.com/withastro/astro/pull/5034) [`2d9d42216`](https://github.com/withastro/astro/commit/2d9d42216722334db03adb14e59773db8389b7f9) Thanks [@bluwy](https://github.com/bluwy)! - Support strict dependency install

## 0.9.2

### Patch Changes

- [#4997](https://github.com/withastro/astro/pull/4997) [`a2b66c754`](https://github.com/withastro/astro/commit/a2b66c754969af4ce98bb10654286a4445cb0999) Thanks [@panwauu](https://github.com/panwauu)! - Fixes a bug that lost query parameters for remote images in the `<Picture />` component

## 0.9.1

### Patch Changes

- [#4944](https://github.com/withastro/astro/pull/4944) [`a8f1a91e7`](https://github.com/withastro/astro/commit/a8f1a91e7e0605d847ddcdf4d7824d1b1fe9b838) Thanks [@scottaw66](https://github.com/scottaw66)! - Moves http-cache-semantics from dev dependency to dependency

## 0.9.0

### Minor Changes

- [#4909](https://github.com/withastro/astro/pull/4909) [`989298961`](https://github.com/withastro/astro/commit/9892989619770f310eed3398dd2cbc98be469afd) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds caching support for transformed images :tada:

  Local images will be cached for 1 year and invalidated when the original image file is changed.

  Remote images will be cached based on the `fetch()` response's cache headers, similar to how a CDN would manage the cache.

  **cacheDir**

  By default, transformed images will be cached to `./node_modules/.astro/image`. This can be configured in the integration's config options.

  ```
  export default defineConfig({
  	integrations: [image({
      // may be useful if your hosting provider allows caching between CI builds
      cacheDir: "./.cache/image"
    })]
  });
  ```

  Caching can also be disabled by using `cacheDir: false`.

### Patch Changes

- [#4933](https://github.com/withastro/astro/pull/4933) [`64a1d712e`](https://github.com/withastro/astro/commit/64a1d712efd3cc80c0b9aed9f2ead1487f8db07b) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes a bug in dev when `<Image />` is used for a local image with no transformations

## 0.8.1

### Patch Changes

- [#4906](https://github.com/withastro/astro/pull/4906) [`ec55745ae`](https://github.com/withastro/astro/commit/ec55745ae5454207fa0405170588d898b49b9a48) Thanks [@tony-sull](https://github.com/tony-sull)! - Updates the default image service to use format-specific quality defaults

- [#4842](https://github.com/withastro/astro/pull/4842) [`812658ad2`](https://github.com/withastro/astro/commit/812658ad2ab3732a99e35c4fd903e302e723db46) Thanks [@bluwy](https://github.com/bluwy)! - Specify sharp as optional peer dependency

- [#4842](https://github.com/withastro/astro/pull/4842) [`812658ad2`](https://github.com/withastro/astro/commit/812658ad2ab3732a99e35c4fd903e302e723db46) Thanks [@bluwy](https://github.com/bluwy)! - Add missing dependencies, support strict dependency installation (e.g. pnpm)

## 0.8.0

### Minor Changes

- [#4738](https://github.com/withastro/astro/pull/4738) [`fad3867ad`](https://github.com/withastro/astro/commit/fad3867adbfb3a38bec8a1a122d32f953a2072fb) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds a new built-in image service based on web assembly libraries :drum: web container support!

  **Migration:** Happy with the previous image service based on [`sharp`](https://sharp.pixelplumbing.com/)? No problem! Install `sharp` in your project and update your Astro config to match.

  ```sh
  npm install sharp
  ```

  ```astro title="astro.config.mjs"
  ---
  import image from '@astrojs/image';

  export default {
    // ...
    integrations: [
      image({
        serviceEntryPoint: '@astrojs/image/sharp',
      }),
    ],
  };
  ---
  ```

### Patch Changes

- [#4797](https://github.com/withastro/astro/pull/4797) [`944d24e9e`](https://github.com/withastro/astro/commit/944d24e9ee813bb7dd45776a975b5bccb46b44cd) Thanks [@smeevil](https://github.com/smeevil)! - Do not pass width and height to the img element when wrapped in a picture element

## 0.7.1

### Patch Changes

- [#4800](https://github.com/withastro/astro/pull/4800) [`ea37de86e`](https://github.com/withastro/astro/commit/ea37de86e4b0f1e1e371fabf37495321c71bd24d) Thanks [@obennaci](https://github.com/obennaci)! - Prevent background flattening on formats supporting transparency

## 0.7.0

### Minor Changes

- [#4438](https://github.com/withastro/astro/pull/4438) [`1e5d8ba9a`](https://github.com/withastro/astro/commit/1e5d8ba9af4eb017382263653216e5247d96ab79) Thanks [@obennaci](https://github.com/obennaci)! - Support additional Sharp resize options

## 0.6.1

### Patch Changes

- [#4678](https://github.com/withastro/astro/pull/4678) [`4c05c65a3`](https://github.com/withastro/astro/commit/4c05c65a3df5bae935afebc8a15ff52d5b912d8b) Thanks [@tony-sull](https://github.com/tony-sull)! - Updates the integration to build all optimized images to `dist/assets` during SSG builds

## 0.6.0

### Minor Changes

- [#4642](https://github.com/withastro/astro/pull/4642) [`e4348a4eb`](https://github.com/withastro/astro/commit/e4348a4eb49466579204eb5f7fb8823736f467c0) Thanks [@beeb](https://github.com/beeb)! - Added a `background` option to specify a background color to replace transparent pixels (alpha layer).

### Patch Changes

- [#4649](https://github.com/withastro/astro/pull/4649) [`db70afdcd`](https://github.com/withastro/astro/commit/db70afdcd5b7d6b39c9953e88dbdadc5e3a93175) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes a bug related to filenames for remote images in SSG builds

## 0.5.1

### Patch Changes

- [#4626](https://github.com/withastro/astro/pull/4626) [`494c2b835`](https://github.com/withastro/astro/commit/494c2b8353d1975d840c5acaf70cb513b99c58e5) Thanks [@altano](https://github.com/altano)! - Parallelize image transforms

## 0.5.0

### Minor Changes

- [#4511](https://github.com/withastro/astro/pull/4511) [`72c760e9b`](https://github.com/withastro/astro/commit/72c760e9b8e70dc4c8d4cc08f453d58a8928a0ee) Thanks [@DerYeger](https://github.com/DerYeger)! - feat: throw if alt text is missing

### Patch Changes

- [#4593](https://github.com/withastro/astro/pull/4593) [`56f83be92`](https://github.com/withastro/astro/commit/56f83be92a6417bb1cbb88dd58c3dcaf5177b9b6) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes a bug that broke support for local images with spaces in the filename

## 0.4.0

### Minor Changes

- [#4482](https://github.com/withastro/astro/pull/4482) [`00c605ce3`](https://github.com/withastro/astro/commit/00c605ce350be83a07c5855f7b99ee41eee1ee38) Thanks [@tony-sull](https://github.com/tony-sull)! - `<Image />` and `<Picture />` now support using images in the `/public` directory :tada:

  - Moving handling of local image files into the Vite plugin
  - Optimized image files are now built to `/dist` with hashes provided by Vite, removing the need for a `/dist/_image` directory
  - Removes three npm dependencies: `etag`, `slash`, and `tiny-glob`
  - Replaces `mrmime` with the `mime` package already used by Astro's SSR server
  - Simplifies the injected `_image` route to work for both `dev` and `build`
  - Adds a new test suite for using images with `@astrojs/mdx` - including optimizing images straight from `/public`

## 0.3.7

### Patch Changes

- [#4534](https://github.com/withastro/astro/pull/4534) [`b8a80bc42`](https://github.com/withastro/astro/commit/b8a80bc42d5a254a66c32761e842841955c01450) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix import.meta.env not being available when using the image integration's types

## 0.3.6

### Patch Changes

- [#4338](https://github.com/withastro/astro/pull/4338) [`579e2daf8`](https://github.com/withastro/astro/commit/579e2daf8dd1816737d1bd253bf96c108a014061) Thanks [@tony-sull](https://github.com/tony-sull)! - When using remote images in SSG builds, query parameters from the original image source should be stripped from final build output

## 0.3.5

### Patch Changes

- [#4342](https://github.com/withastro/astro/pull/4342) [`c4af8723b`](https://github.com/withastro/astro/commit/c4af8723bd232d78d24dbd58feaef87dbaec07c7) Thanks [@tony-sull](https://github.com/tony-sull)! - The integration now includes a logger to better track progress in SSG builds. Use the new `logLevel: "debug"` integration option to see detailed logs of every image transformation built in your project.

## 0.3.4

### Patch Changes

- [#4279](https://github.com/withastro/astro/pull/4279) [`42fd6936c`](https://github.com/withastro/astro/commit/42fd6936cdb7106aea3770bed5313e558fc8b6dc) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add better warnings if the integration was not properly configured.

## 0.3.3

### Patch Changes

- [#4221](https://github.com/withastro/astro/pull/4221) [`92aa6a75e`](https://github.com/withastro/astro/commit/92aa6a75eac274942e438de06df71f8261fdbcc2) Thanks [@alex-drocks](https://github.com/alex-drocks)! - README update

## 0.3.2

### Patch Changes

- [#4140](https://github.com/withastro/astro/pull/4140) [`4678a3f35`](https://github.com/withastro/astro/commit/4678a3f358840db853db55b753b329ae592a589c) Thanks [@jackmerrill](https://github.com/jackmerrill)! - Added support for GIF to Animated WEBP images

* [#4173](https://github.com/withastro/astro/pull/4173) [`581120818`](https://github.com/withastro/astro/commit/5811208182fb70fad730b0e495d054ba970b9353) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixes a bug related to local image files in SSR builds on Windows

- [#4147](https://github.com/withastro/astro/pull/4147) [`c039ea93a`](https://github.com/withastro/astro/commit/c039ea93a1372d954f924a1e6a019a834d1eeb7a) Thanks [@crutchcorn](https://github.com/crutchcorn)! - Enable usage outside of vite contexts, such as the config file

* [#4146](https://github.com/withastro/astro/pull/4146) [`97cf0cd89`](https://github.com/withastro/astro/commit/97cf0cd893b950a48ffa631247528b4b4ad73109) Thanks [@crutchcorn](https://github.com/crutchcorn)! - Export all "dist" files

## 0.3.1

### Patch Changes

- [#4141](https://github.com/withastro/astro/pull/4141) [`65f2d3b4b`](https://github.com/withastro/astro/commit/65f2d3b4b1d31411ee2ea450478349413d8f4cf6) Thanks [@FredKSchott](https://github.com/FredKSchott)! - fix windows "bad package export" error

## 0.3.0

### Minor Changes

- [#4045](https://github.com/withastro/astro/pull/4045) [`a397b981f`](https://github.com/withastro/astro/commit/a397b981f5f46dee85e6e00aa39633d018d4b9a2) Thanks [@tony-sull](https://github.com/tony-sull)! - Big improvements to the TypeScript and Language Tools support for `@astrojs/image` :tada:

## 0.2.0

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

* [#3570](https://github.com/withastro/astro/pull/3570) [`04070c0c1`](https://github.com/withastro/astro/commit/04070c0c12c00a3e17842ce48e36edc3f2c890a3) Thanks [@matthewp](https://github.com/matthewp)! - Bump to Vite 3!

- [#4013](https://github.com/withastro/astro/pull/4013) [`ef9345767`](https://github.com/withastro/astro/commit/ef9345767b898b436acc6da32da4936b882fd926) Thanks [@tony-sull](https://github.com/tony-sull)! - - Fixes two bugs that were blocking SSR support when deployed to a hosting service
  - The built-in `sharp` service now automatically rotates images based on EXIF data

### Patch Changes

- [#3961](https://github.com/withastro/astro/pull/3961) [`d73c04a9e`](https://github.com/withastro/astro/commit/d73c04a9e58c7d320cdb4f34604de76b30199778) Thanks [@tony-sull](https://github.com/tony-sull)! - Updates the <Picture /> component to pass the `alt` attribute down to the <img> element

* [#4021](https://github.com/withastro/astro/pull/4021) [`9aecf7c7c`](https://github.com/withastro/astro/commit/9aecf7c7c7211f34236d8dde624ca388310d3727) Thanks [@delucis](https://github.com/delucis)! - Handle EXIF orientation flag

- [#4048](https://github.com/withastro/astro/pull/4048) [`e60d6d9c1`](https://github.com/withastro/astro/commit/e60d6d9c1df7d53613c2bf46c6cfc06ac04100c5) Thanks [@tony-sull](https://github.com/tony-sull)! - Removes Node's `fileURLToPath` dependency in the production SSR endpoint

* [#4004](https://github.com/withastro/astro/pull/4004) [`ef9c4152b`](https://github.com/withastro/astro/commit/ef9c4152b2b399e25bf4e8aa7b37adcf6d0d8f17) Thanks [@sarah11918](https://github.com/sarah11918)! - [READMEs] removed "experimental" from astro add instructions

- [#3980](https://github.com/withastro/astro/pull/3980) [`eaf187f2c`](https://github.com/withastro/astro/commit/eaf187f2c40493abec28113c742ef392c812d0e2) Thanks [@tony-sull](https://github.com/tony-sull)! - Fixing TypeScript definition exports for image components

## 0.1.3

### Patch Changes

- [#3957](https://github.com/withastro/astro/pull/3957) [`2a7dd040e`](https://github.com/withastro/astro/commit/2a7dd040e8a65d62fbb3bbd7308f523bd48deda5) Thanks [@tony-sull](https://github.com/tony-sull)! - Improves the `astro dev` experience when using a third-party hosted image service

* [#3965](https://github.com/withastro/astro/pull/3965) [`299b4afca`](https://github.com/withastro/astro/commit/299b4afcab090bbe014d4eaf2a5ea439e8436bcc) Thanks [@tony-sull](https://github.com/tony-sull)! - Adding a unique hash to remote images built for SSG to ensure unique URLs are always de-duplicated

## 0.1.2

### Patch Changes

- [#3885](https://github.com/withastro/astro/pull/3885) [`bf5d1cc1e`](https://github.com/withastro/astro/commit/bf5d1cc1e71da38a14658c615e9481f2145cc6e7) Thanks [@delucis](https://github.com/delucis)! - Integration README fixes

## 0.1.1

### Patch Changes

- [#3876](https://github.com/withastro/astro/pull/3876) [`f9614128`](https://github.com/withastro/astro/commit/f9614128622583cba6f65cb4202d56a71b4269a3) Thanks [@tony-sull](https://github.com/tony-sull)! - Bug: Updating the <Picture /> component to default to async image decoding

## 0.1.0

### Minor Changes

- [#3866](https://github.com/withastro/astro/pull/3866) [`89d76753`](https://github.com/withastro/astro/commit/89d76753a0dc50b2967d1fa9d36e34bde2722b83) Thanks [@tony-sull](https://github.com/tony-sull)! - The new `<Picture />` component adds art direction support for building responsive images with multiple sizes and file types :tada:

### Patch Changes

- [#3865](https://github.com/withastro/astro/pull/3865) [`1f9e4857`](https://github.com/withastro/astro/commit/1f9e4857ff2b2cb7db89d619618cdf546cd3b3dc) Thanks [@delucis](https://github.com/delucis)! - Small README fixes

* [#3854](https://github.com/withastro/astro/pull/3854) [`b012ee55`](https://github.com/withastro/astro/commit/b012ee55b107dea0730286263b27d83e530fad5d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Support adapters and third party packages

- [#3848](https://github.com/withastro/astro/pull/3848) [`502f0631`](https://github.com/withastro/astro/commit/502f0631317fe1b23582d4126c44f44cb0b0716f) Thanks [@matthewp](https://github.com/matthewp)! - Allow importing the Image component from @astrojs/image

* [#3869](https://github.com/withastro/astro/pull/3869) [`0aaef1c4`](https://github.com/withastro/astro/commit/0aaef1c48bacff5a05498af201d456efeac82ac2) Thanks [@tony-sull](https://github.com/tony-sull)! - Bugfix: fixing a bug that broke builds in NPM workspaces

## 0.0.4

### Patch Changes

- [#3812](https://github.com/withastro/astro/pull/3812) [`5ccccace`](https://github.com/withastro/astro/commit/5ccccace0cc3055117f118a88231999fab585a3b) Thanks [@tony-sull](https://github.com/tony-sull)! - - Updates how the `<Image />` component is exported to support older versions of Astro
  - Adds an example of using the `<Image />` component in markdown pages

## 0.0.3

### Patch Changes

- [#3795](https://github.com/withastro/astro/pull/3795) [`d143d24c`](https://github.com/withastro/astro/commit/d143d24c7246153e6f66d8e0f3f9c78cadfee258) Thanks [@tony-sull](https://github.com/tony-sull)! - Automatically adds the required `vite.optimizeDeps` config for `sharp`. Also ensures that only whole numbers are passed to sharp's resize transform

## 0.0.2

### Patch Changes

- [#3788](https://github.com/withastro/astro/pull/3788) [`f4943e0f`](https://github.com/withastro/astro/commit/f4943e0fbced044f0ba4435cb41d77b67c98e69f) Thanks [@tony-sull](https://github.com/tony-sull)! - Initial release! 🎉
