# @astrojs/language-server

## 0.23.3

### Patch Changes

- 150946c: Publish failed

## 0.23.2

### Patch Changes

- b13fb51: Don't use `workspace/configuration` on clients that don't support it

## 0.23.1

### Patch Changes

- 422376e: Load settings from the Prettier VS Code extension when available

## 0.23.0

### Minor Changes

- 1dcef68: Automatically type `Astro.props` using the Props interface when available

### Patch Changes

- b6c95f2: Fix completions for HTML attributes not working anymore since 0.20.3

## 0.22.0

### Minor Changes

- d5aafc0: Formatting is now powered by Prettier and our Prettier plugin. Going forward, this should result in a more stable and complete way of formatting Astro files

### Patch Changes

- 61620f1: Add support for Go To Type Definition
- 9337f00: Fix language server not working when no initlizationOptions were passed

## 0.21.1

### Patch Changes

- 0e9d7d0: Improve error handling in cases where we can't load types from the user's project and when the project isn't at the root of the folder
- 3f79dbf: Fix `tsconfig.json` not loading properly in certain contexts on Windows

## 0.21.0

### Minor Changes

- 574b75d: Remove support for the Markdown component
- d23ba22: Changed how Astro's types are consumed to avoid making type acquisition explicit inside Astro files

### Patch Changes

- 81f3aa5: Added a debug command to show the currently opened document's TSX output

## 0.20.3

### Patch Changes

- 081cf24: Fix completions not working inside script tags, fix duplicate completions in some cases, added completions for the slot element

## 0.20.1

### Patch Changes

- e6996f5: Fixed many situations where the language server would warn abusively about not being able to find Astro
- 4589c2b: Fix the language server not warning properly when a package is implicitely any due to missing types

## 0.20.0

### Minor Changes

- ba0fab1: Load language integrations from the user's project instead of bundling them in the language server

### Patch Changes

- fa3f0f7: Updated exports for `astro check`

## 0.19.6

### Patch Changes

- 4c1045d: Empty changeset because publish failed

## 0.19.5

### Patch Changes

- 421ab52: Added a new setting (`astro.typescript.allowArbitraryAttributes`) to enable support for arbitrary attributes
- 06e3c95: Updated behaviour when no settings are provided. All features are now considered enabled by default
- 301dcfb: Remove Lodash from the code base, significally reducing the file count of the package
- dd1283b: Updated Component detection so completions now work for namespaced components (for example, typing `<myMarkdown.` will now give you a completion for the Content component)

## 0.19.4

### Patch Changes

- 1033856: Enable support for TypeScript inside hoisted script tags

## 0.19.3

### Patch Changes

- 49ff4ef: Fixed more bugs where nonexistent server settings would result in a crash
- 14cbf05: Fix frontmatter completion not working when three dashes were already present

## 0.19.2

### Patch Changes

- 7de4967: Add better error messages for Vue and Svelte components with syntax errors
- Updated dependencies [7de4967]
  - @astrojs/svelte-language-integration@0.1.6
  - @astrojs/vue-language-integration@0.1.1

## 0.19.1

### Patch Changes

- 729dff5: Add support for giving linked editing ranges
- 05a48c2: Fix some TypeScript diagnostics not showing up in certain cases
- fe2d26b: Add support for showing Svelte components documentation on hover
- Updated dependencies [fe2d26b]
  - @astrojs/svelte-language-integration@0.1.5

## 0.19.0

### Minor Changes

- a97b9a4: Add support for Inlay Hints. Minimum VS Code version supported starting from this update is 1.67.0 (April 2022)

## 0.18.1

### Patch Changes

- 666739a: Revert update to latest LSP and inlay hints support

## 0.18.0

### Minor Changes

- d3c6fd8: Add support for formatting
- 09e1163: Updated language server to latest version of LSP, added support for Inlay Hints
- fcaba8e: Add support for completions and type checking for Vue props

### Patch Changes

- 4138005: Fix frontmatter folding not working properly when last few lines of frontmatter are empty
- 76ff46a: Add `?` in the label of completions of optional parameters (including component props)

## 0.17.0

### Minor Changes

- 3ad0f65: Add support for TypeScript features inside script tags (completions, diagnostics, hover etc)

### Patch Changes

- 2e9da14: Add support for loading props completions from .d.ts files, improve performance of props completions

## 0.16.1

### Patch Changes

- ad5a5e5: Fix misc issues with Go To Definition
- 1bd790d: Updates config management, make sure to respect TypeScript settings when doing completions and quickfixes

## 0.16.0

### Minor Changes

- 9abff62: Add support for code actions

### Patch Changes

- b485acd: Fixed bug where nonexistent server settings would result in a crash
- 1cff04c: Fix Emmet settings not being loaded, add support for Emmet in CSS
- 1bcae45: Remove support for Node 12 (VS Code versions under 1.56)
- c8d81a1: Update directives tooltips, add missing `is:raw`
- Updated dependencies [1bcae45]
  - @astrojs/svelte-language-integration@0.1.4

## 0.15.0

### Minor Changes

- 6bb45cb: Overhaul TypeScript completions

  - Add support for completions inside expressions
  - Add support for auto imports on completion
  - Fix misc issues in completions (missing description, deprecated stuff not showing as deprecated)

### Patch Changes

- 7978de1: Add support for folding JavaScript
- 3ac74bc: Improve props completions on components
- Updated dependencies [6bb45cb]
  - @astrojs/svelte-language-integration@0.1.3

## 0.14.0

### Minor Changes

- 9118c46: Add support for loading type definitions from Astro itself

### Patch Changes

- 9ea5b97: Make TypeScript ignore content of Markdown tags
- dbf624a: Fix error when returning a response from the frontmatter

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
