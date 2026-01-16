# @astrojs/check

## 0.9.6

### Patch Changes

- [#14740](https://github.com/withastro/astro/pull/14740) [`abfed97`](https://github.com/withastro/astro/commit/abfed97d45ab04c625d6463f9be1e5b1d23c3573) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes link targets in documentation following repository relocation.

- Updated dependencies [[`abfed97`](https://github.com/withastro/astro/commit/abfed97d45ab04c625d6463f9be1e5b1d23c3573)]:
  - @astrojs/language-server@2.16.1

## 0.9.5

### Patch Changes

- d415d4e: When no errors or warnings are detected, display "0 errors" or "0 warnings" in a dimmed color on the console instead of red or yellow.

## 0.9.4

### Patch Changes

- 6e62aaa: Upgrades chokidar to v4
- 5a44072: Fixes formatting not working by default in certain circumstances
- Updated dependencies [5a44072]
- Updated dependencies [3a836de]
  - @astrojs/language-server@2.15.0

## 0.9.3

### Patch Changes

- 28dfebe: Updates to the stable version of Volar 2.4.0
- Updated dependencies [28dfebe]
  - @astrojs/language-server@2.14.1

## 0.9.2

### Patch Changes

- e8e18a8: Fixes an issue where errors inside script and style tags could be offset by a few characters when multi bytes characters were present in the file
- Updated dependencies [e8e18a8]
  - @astrojs/language-server@2.13.2

## 0.9.1

### Patch Changes

- cc94bef: Revert a change to top-level returns that could prevent the return types of functions from being correct in certain cases
- Updated dependencies [cc94bef]
  - @astrojs/language-server@2.13.1

## 0.9.0

### Minor Changes

- b65d6b4: Adds support for SCSS and LESS intellisense inside style tags

### Patch Changes

- Updated dependencies [3a60f00]
- Updated dependencies [b65d6b4]
  - @astrojs/language-server@2.13.0

## 0.8.3

### Patch Changes

- 0a46801: Fixes a regression where errors could wrongly show (or not show) inside scripts and style tags
- Updated dependencies [0a46801]
- Updated dependencies [72f61e1]
  - @astrojs/language-server@2.12.7

## 0.8.2

### Patch Changes

- 708167e: Fixes script and style tags being wrongfully included in the generated TSX
- Updated dependencies [708167e]
  - @astrojs/language-server@2.12.1

## 0.8.1

### Patch Changes

- 5eb20f2: Fixes installation on Yarn 4
- Updated dependencies [5eb20f2]
  - @astrojs/language-server@2.11.1

## 0.8.0

### Minor Changes

- b8a6af3: Upgrades to the latest version of Volar, the underlying framework powering the Astro language server. This update should fix some of the recent issues regarding intellisense inside script tags.

### Patch Changes

- a1769da: Adds a README with helpful links
- Updated dependencies [b8a6af3]
  - @astrojs/language-server@2.11.0

## 0.7.0

### Minor Changes

- c8af6db: Upgrades the language server to use the latest version of Volar. This changes should have no negative impacts on the experience.

### Patch Changes

- Updated dependencies [c8af6db]
  - @astrojs/language-server@2.10.0

## 0.6.0

### Minor Changes

- 65d3425: Upgrades the language server to use Volar 2.2. This changes should have no negative impacts on the experience.

### Patch Changes

- Updated dependencies [65d3425]
  - @astrojs/language-server@2.9.0

## 0.5.10

### Patch Changes

- 9ca368b: Update to the latest version of Volar. This release should fix some of the caching issues that has crept up recently
- Updated dependencies [9ca368b]
- Updated dependencies [d57daad]
- Updated dependencies [b166787]
- Updated dependencies [eb49fb2]
  - @astrojs/language-server@2.8.4

## 0.5.9

### Patch Changes

- f1447ef: chore: Update `volar-service-prettier`. This is only an internal refactor and there should be no visible changes.
- Updated dependencies [f1447ef]
  - @astrojs/language-server@2.8.1

## 0.5.8

### Patch Changes

- 85b42dc: Update to the latest version of Volar. This release fixes a few issues such as missing Prettier crashing the language server in some cases, resolutions not working correctly inside TSX files, and more.
- Updated dependencies [85b42dc]
  - @astrojs/language-server@2.8.0

## 0.5.7

### Patch Changes

- 1b68dfb: Improves descriptions for attributes specific to Astro (`is:raw`, `set:html`, etc.)
- Updated dependencies [2bad6a8]
- Updated dependencies [1b68dfb]
  - @astrojs/language-server@2.7.7

## 0.5.6

### Patch Changes

- fe6165b: Makes astro check --tsconfig understand relative file names
- Updated dependencies [fe6165b]
  - @astrojs/language-server@2.7.6

## 0.5.5

### Patch Changes

- 1436e6e: Fixes mapping from compiler location to LSP range.
- Updated dependencies [7c4c1f2]
- Updated dependencies [1436e6e]
  - @astrojs/language-server@2.7.5

## 0.5.4

### Patch Changes

- 6924c7e: Fixes semantic highlighting not working inside .ts(x) files in certain cases
- 310fbfe: Fix Svelte and Vue integrations not working on Windows in certain cases
- Updated dependencies [6924c7e]
- Updated dependencies [310fbfe]
  - @astrojs/language-server@2.7.4

## 0.5.3

### Patch Changes

- de58706: Fix imports from certain packages not working correctly in certain cases
- Updated dependencies [de58706]
  - @astrojs/language-server@2.7.3

## 0.5.2

### Patch Changes

- a2280a8: Avoid checking Svelte and Vue files when running astro check
- Updated dependencies [a2280a8]
  - @astrojs/language-server@2.7.2

## 0.5.1

### Patch Changes

- 7b1ab72: Fix TypeScript not working inside script tags
- Updated dependencies [7b1ab72]
  - @astrojs/language-server@2.7.1

## 0.5.0

### Minor Changes

- 15a5532: Upgrade to Volar 2.0. No regressions are currently expected, however as this is a fairly consequential backend change, please report any issues you encounter.

  For reference, Volar is the underlying framework that powers the Astro language server, you can think of it as Vite for editor tooling.

### Patch Changes

- Updated dependencies [15a5532]
  - @astrojs/language-server@2.7.0

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
