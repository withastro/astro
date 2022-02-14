# @astrojs/renderer-preact

## 0.5.0-next.0

### Minor Changes

- [#2563](https://github.com/withastro/astro/pull/2563) [`a907a73b`](https://github.com/withastro/astro/commit/a907a73b8cd14726d158ea460932f9cd8891923a) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Upgrade renderer dependencies for `vite@2.8.x`

## 0.4.0

### Minor Changes

- [#2202](https://github.com/withastro/astro/pull/2202) [`45cea6ae`](https://github.com/withastro/astro/commit/45cea6aec5a310fed4cb8da0d96670d6b99a2539) Thanks [@jonathantneal](https://github.com/jonathantneal)! - Officially drop support for Node v12. The minimum supported version is now Node v14.15+,

## 0.3.2

### Patch Changes

- [#2170](https://github.com/withastro/astro/pull/2170) [`5af24efb`](https://github.com/withastro/astro/commit/5af24efb3493b8f5b6a8f980c792455c7dc34eb5) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix preact 10.6 regression by pinning to preact 10.5

## 0.3.1

### Patch Changes

- [#2078](https://github.com/withastro/astro/pull/2078) [`ac3e8702`](https://github.com/withastro/astro/commit/ac3e870280e983a7977da79b6eec0568d38d8420) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix behavior of renderers when no children are passed in

## 0.3.0

### Minor Changes

- e6aaeff5: Updated framework renderers for the v0.21.0 release of Astro. Assorted changes and a new renderer interface are included in this release.

## 0.3.0-next.1

### Patch Changes

- 3cd1458a: Bugfix: Bundled CSS missing files on Windows

## 0.3.0-next.0

### Minor Changes

- d84bfe71: Updates the renderers to confirm to the new renderer API.

## 0.2.2

### Patch Changes

- 97d37f8f: Update READMEs for all renderers

## 0.2.1

### Patch Changes

- f7e86150: Fix an issue where preact component UI wouldn't update on hydrate

## 0.2.0

### Minor Changes

- bd18e14: Switches to [the new JSX Transform](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) originally introduced for React v17. This also leverages the new `jsxTransformOptions` options for renderers.

  This change also removes the need for importing your Framework's `jsxFactory` directly, which means you can wave goodbye to `import React from "react";` and `import { h } from "preact";`.

  > **If you are using mutliple frameworks** and a file doesn't reference `react` or `preact`, Astro might not be able to locate the correct renderer! You can add a pragma comment like `/** @jsxImportSource preact */` to the top of your file. Alternatively, just import the JSX pragma as you traditionally would have.

### Patch Changes

- bd18e14: Update `check` logic to exclude false-positives from SolidJS

## 0.2.0-next.0

### Minor Changes

- bd18e14: Switches to [the new JSX Transform](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) originally introduced for React v17. This also leverages the new `jsxTransformOptions` options for renderers.

  This change also removes the need for importing your Framework's `jsxFactory` directly, which means you can wave goodbye to `import React from "react";` and `import { h } from "preact";`.

  > **If you are using mutliple frameworks** and a file doesn't reference `react` or `preact`, Astro might not be able to locate the correct renderer! You can add a pragma comment like `/** @jsxImportSource preact */` to the top of your file. Alternatively, just import the JSX pragma as you traditionally would have.

### Patch Changes

- bd18e14: Update `check` logic to exclude false-positives from SolidJS

## 0.1.3

### Patch Changes

- 0abd251: Allows renderers to provide knownEntrypoint config values

## 0.1.2

### Patch Changes

- 9d4a40f: Fixes bug with using arrow function components

## 0.1.1

### Patch Changes

- ab2972b: Update package.json engines for esm support

## 0.1.0

### Minor Changes

- 643c880: Initial release

## 0.1.0-next.0

### Minor Changes

- 643c880: Initial release
