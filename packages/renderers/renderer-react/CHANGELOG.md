# @astrojs/renderer-react

## 0.3.0-next.0

### Minor Changes

- d84bfe71: Updates the renderers to confirm to the new renderer API.

## 0.2.2

### Patch Changes

- 756e3769: Fixes detect to allow rendering React.PureComponents

## 0.2.1

### Patch Changes

- 97d37f8f: Update READMEs for all renderers

## 0.2.0

### Minor Changes

- bd18e14: Switches to [the new JSX Transform](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) originally introduced for React v17. This also leverages the new `jsxTransformOptions` options for renderers.

  This change also removes the need for importing your Framework's `jsxFactory` directly, which means you can wave goodbye to `import React from "react";` and `import { h } from "preact";`.

  > **If you are using mutliple frameworks** and a file doesn't reference `react` or `preact`, Astro might not be able to locate the correct renderer! You can add a pragma comment like `/** @jsxImportSource preact */` to the top of your file. Alternatively, just import the JSX pragma as you traditionally would have.

## 0.2.0-next.0

### Minor Changes

- bd18e14: Switches to [the new JSX Transform](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) originally introduced for React v17. This also leverages the new `jsxTransformOptions` options for renderers.

  This change also removes the need for importing your Framework's `jsxFactory` directly, which means you can wave goodbye to `import React from "react";` and `import { h } from "preact";`.

  > **If you are using mutliple frameworks** and a file doesn't reference `react` or `preact`, Astro might not be able to locate the correct renderer! You can add a pragma comment like `/** @jsxImportSource preact */` to the top of your file. Alternatively, just import the JSX pragma as you traditionally would have.

## 0.1.5

### Patch Changes

- 1e01251: Fixes bug with React renderer that would not hydrate correctly

## 0.1.4

### Patch Changes

- 21dc28c: Add react-dom as a knownEntrypoint (speeds up astro startup)

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
