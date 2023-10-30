# @astrojs/ts-plugin

## 1.3.0

### Minor Changes

- f4402eb: Add intellisense for Astro.self, add auto inferring of props for `getStaticPaths`

## 1.2.0

### Minor Changes

- 9381e1d: Update dependencies

## 1.1.3

### Patch Changes

- 4e10283: Fix TSServer crash, for real this time

## 1.1.2

### Patch Changes

- 4b510dd: Fix TSServer crashing in certain situations

## 1.1.1

### Patch Changes

- 65fca95: Update Volar to latest version. This fixes resolving Astro files from `node_modules` and various other import errors.

## 1.1.0

### Minor Changes

- f9b2aea: The Astro TypeScript plugin is now powered by Volar! Much like our Volar-powered language server, this brings many improvement in stability, performance and in the future, will allow us to add more features to it much more easily than before.

### Patch Changes

- 1202c9d: Upgraded dependencies, added support for Prettier 3

## 1.0.10

### Patch Changes

- 60e4ce0: Fix packaging error causing TypeScript plugin to not work

## 1.0.9

### Patch Changes

- b6a98e0: Better handle when the Astro compiler fails to parse a file

## 1.0.8

### Patch Changes

- 170a193: Update dependencies

## 1.0.7

### Patch Changes

- c6cf1d7: Update Prettier plugin version

## 1.0.6

### Patch Changes

- 3fcbc1a: Fix TypeScript plugin crashing at start in certain circumstances

## 1.0.5

### Patch Changes

- ae15420: Fix importing `.astro` files in `.ts` files not working with TypeScript 5.0+

## 1.0.4

### Patch Changes

- eaefe96: Fix packaging error

## 1.0.3

### Patch Changes

- 685513b: Improve stability related to converting files to TSX

## 1.0.0

### Major Changes

- 39a7669: 1.0! This release includes no new changes by itself, but symbolize the official release of what was previously the pre-release version of the extension. For changelogs, please refer to the changelog from `0.29.0` to now.

## 0.4.5

### Patch Changes

- 8ff8bdf: Update compiler version to fix Windows mapping issue

## 0.4.4

### Patch Changes

- c04adf3: Upgrade compiler version to 1.1.1

## 0.4.3

### Patch Changes

- 6b81412: Added an explanation on how to generate types for content collections to the error message for the `astro:content` import

## 0.4.2

### Patch Changes

- 94a9b61: Add proper support for renaming symbols inside Astro (.astro) files

## 0.4.1

### Patch Changes

- 985515d: Update `@astrojs/compiler`, fixing a few bugs

## 0.4.0

### Minor Changes

- c8cdef9: Improved support for `.astro` imports inside JavaScript/TypeScript files:
  - Added support for finding file references inside Astro files
  - Added support for path completions for .astro, .md and .mdx files
  - Fixed cases where our TypeScript plugin would fail to load under certain circumstance
  - Fixed certain cases where Go to definition / implementation would fail

## 0.3.0

### Minor Changes

- b66ae70: Update the VS Code extension to use a bundled version of the language server for better performance and compatibility with running the extension in the web

## 0.2.1

### Patch Changes

- d056cd5: Fixes production bugs in extension

## 0.2.0

### Minor Changes

- 6b6b47a: Remove internal astro.d.ts files, instead prefer the one provided by Astro itself

## 0.1.1

### Patch Changes

- f1f3091: Fix commenting, namespaced elements, and Fragment typings
