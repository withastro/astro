# @astrojs/check

## 0.4.1

### Patch Changes

- 63e2c81: Fix fallback types not being properly included in some contexts such as inside the VS Code extension
- Updated dependencies [63e2c81]
  - @astrojs/language-server@2.6.2

## 0.4.0

### Minor Changes

- a314bcc: Remove temporary workaround `astro check` that disabled checking JSX and TSX files

### Patch Changes

- Updated dependencies [a314bcc]
- Updated dependencies [dab6801]
  - @astrojs/language-server@2.6.0

## 0.3.4

### Patch Changes

- b16fcbb: Temporarily disable checking `.jsx` and `.tsx` files using `astro check` until https://github.com/withastro/language-tools/issues/727 is fixed
- Updated dependencies [b16fcbb]
  - @astrojs/language-server@2.5.5

## 0.3.3

### Patch Changes

- 45d49f5: Fix errors spilling out of inline event attributes in certain cases
- 7c9c981: Fix errors inside `.ts` files not being properly reported in certain cases
- Updated dependencies [45d49f5]
- Updated dependencies [7c9c981]
  - @astrojs/language-server@2.5.4

## 0.3.2

### Patch Changes

- 621320a: Fix language server crashing when encountering malformed files in certain cases
- dc98b0b: Fixes an issue where type checking errors were shown on define:vars scripts when "type=module" attribute was also present.
- Updated dependencies [621320a]
- Updated dependencies [dc98b0b]
- Updated dependencies [015a667]
- Updated dependencies [598689a]
  - @astrojs/language-server@2.5.3

## 0.3.1

### Patch Changes

- ee41dce: Add support for TypeScript 5.3
- 19217c4: Automatically flatten inferred unions from `getStaticPaths` into each other so that divergent props don't need to be manually discriminated before destructuring.
- Updated dependencies [bd3d933]
- Updated dependencies [ee41dce]
- Updated dependencies [19217c4]
  - @astrojs/language-server@2.5.2

## 0.3.0

### Minor Changes

- f4402eb: Add intellisense for Astro.self, add auto inferring of props for `getStaticPaths`

### Patch Changes

- Updated dependencies [f4402eb]
  - @astrojs/language-server@2.5.0

## 0.2.1

### Patch Changes

- 9381e1d: Update dependencies
- Updated dependencies [9381e1d]
  - @astrojs/language-server@2.4.0

## 0.2.0

### Minor Changes

- 4115714: Fix logging severity filtering out diagnostics completely from results

### Patch Changes

- Updated dependencies [4115714]
  - @astrojs/language-server@2.3.2
