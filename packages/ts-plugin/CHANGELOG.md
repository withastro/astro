# @astrojs/ts-plugin

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
