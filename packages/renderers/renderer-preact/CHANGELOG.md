# @astrojs/renderer-preact

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
