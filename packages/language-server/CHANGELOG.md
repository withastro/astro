# @astrojs/language-server

## 0.13.4

### Patch Changes

- 5874655: Add support for Astro 0.26.0 attributes

## 0.13.3

### Patch Changes

- 1fb21ff: Add support for folding CSS
- 99d7536: Add support for semantic tokens
- b363c00: Improve completions for components

## 0.13.2

### Patch Changes

- aff8b76: Fix error caused by malformed Svelte components
- Updated dependencies [aff8b76]
  - @astrojs/svelte-language-integration@0.1.2

## 0.13.1

### Patch Changes

- ea74fdb: Publish failed

## 0.13.0

### Minor Changes

- 82b8891: Add HTML hover info, fix Astro directives producing errors, fix missing children property for JSX based frameworks

### Patch Changes

- 9f4f907: Add CSS hover info
- c09116f: Add support for Document Symbols (Outline tab, breadcrumb navigation)

## 0.12.1

### Patch Changes

- 49955c6: Add support for colors indicators and color picker

## 0.12.0

### Minor Changes

- 8a58a56: Refactor the language-server, fixes many issues related to imports, add support for completions in multiple style tags

## 0.11.0

### Minor Changes

- fd92a85: Add support for loading files from non-JSX frameworks such as Vue and Svelte

### Patch Changes

- d056cd5: Fixes production bugs in extension

## 0.9.3

### Patch Changes

- c4d43b4: Deploy to OpenVSX

## 0.9.2

### Patch Changes

- 91404d1: Enable publishing to OpenVSX

## 0.9.1

### Patch Changes

- 7dc85cc: Add support for Emmet inside components, upgrade Emmet version

## 0.9.0

### Minor Changes

- 6b6b47a: Remove internal astro.d.ts files, instead prefer the one provided by Astro itself

## 0.8.10

### Patch Changes

- 5b16fb4: Fix errors showing on wrong line due to an error in TSX generation

## 0.8.9

### Patch Changes

- d0485a2: Only apply content transformations for TSX generation in relevant places

## 0.8.8

### Patch Changes

- 526d5c7: Bring back loading the user js/tsconfig.json, notably, this allow us to support aliases

## 0.8.7

### Patch Changes

- 897ab35: Provide vite client types to Astro files

## 0.8.6

### Patch Changes

- 97559b6: Removes errors with import.meta.hot
- 4c93d24: Prevent reading tsconfig in .astro files

## 0.8.5

### Patch Changes

- f1f3091: Fix commenting, namespaced elements, and Fragment typings

## 0.8.4

### Patch Changes

- 481e009: Add Node v12 support, testing

## 0.8.3

### Patch Changes

- fef3091: Updates `typescript` from 4.5.1-rc to 4.5.2 (stable)

## 0.8.2

### Patch Changes

- 528c6bd: Adds missing dependencies

## 0.8.1

### Patch Changes

- b20db6e: Bump TypeScript from 4.3.1-rc to 4.5.1-rc

## 0.7.19

### Patch Changes

- 2910b03: Add support for at-prefixed attributes

## 0.7.18

### Patch Changes

- 12b4ed3: Adds support for Astro.slots typing

## 0.7.17

### Patch Changes

- 7c6f6a6: Fixes issue with errors not going away after fixing them

## 0.7.16

### Patch Changes

- b6f44d4: Change hover text to display HTML attribute instead of JSX
- 4166283: Prevents errors when using the Fragment component

## 0.7.15

### Patch Changes

- 6340a79: Adds dts files for using the language server programmatically

## 0.7.14

### Patch Changes

- e0facf6: Adds an AstroCheck export, to allow running diagnostics programmatically
- 3c903c3: Add DiagnosticSeverity as an export
- b0a8bc1: Added Rename Symbol capability

## 0.7.13

### Patch Changes

- 1b2afc7: Prevents presence of @types/react from causing false-positive astro errors

## 0.7.12

### Patch Changes

- 553969e: Fixes errors when using a tsconfig.json

  Previously when using a tsconfig.json that had an `include` property, that property would cause diagnostics in astro files to show JSX related errors. This fixes that issue.

- b4c1b70: Fixes diagnostic false-positives with comments wrapping HTML

## 0.7.11

### Patch Changes

- 02bcb91: Prevents false-positive errors when lots of comments are used

## 0.7.10

### Patch Changes

- 1958d51: Default Astro.fetchContent to treat type param as any
- f558e54: When no Props interface is provide, treat as any

## 0.7.9

### Patch Changes

- 6c952ae: Fixes diagnostic issues with omitting semicolons in the frontmatter section

## 0.7.8

### Patch Changes

- f2f7fc8: Removes errors shown when using Astro.resolve

## 0.7.7

### Patch Changes

- 6501757: Fixes false-positive errors on importing images

## 0.7.6

### Patch Changes

- ea2d56d: Bump version to fix unpublished version in npm

## 0.7.4

### Patch Changes

- 6604c9f: Fixes diagnostic false-positive caused by doctype

## 0.7.3

### Patch Changes

- 8f7bd34: Fixes false-positive error when using blockquotes within Markdown component

## 0.7.2

### Patch Changes

- 1b3a832: Adds diagnostics (errors and warnings)

## 0.7.1

### Patch Changes

- 7874c06: Improves completion performance

  Completion performance is improved by fixing a bug where we were giving the TypeScript compiler API the wrong name of files, causing it to search for files for a long time.

## 0.7.0

### Minor Changes

- 72d3ff0: Adds support for prop completion from ts/jsx files

## 0.6.0

- Fixes bug with signature help not appear in the component script section.
- Adds completion suggestions for Astro.\* APIs in the component script.
- Adds support for Hover based hints in the component script section.
- Fixes bug with Go to Definition (cmd + click) of Components.

## 0.5.0

- Fix `bin` file

## 0.5.0-next.1

- Expose `bin/server.js` as `astro-ls`

## 0.5.0-next.0

- Moved to scoped `@astrojs/language-server` package
- Removed some `devDependencies` from the bundle and added them to `dependencies`

## 0.4.0

### Minor Changes

- 06e2597: Adds support for import suggestions
