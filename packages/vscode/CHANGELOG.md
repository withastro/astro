# astro-vscode

## 0.29.1

### Patch Changes

- 985515d: Update `@astrojs/compiler`, fixing a few bugs
- Updated dependencies [985515d]
  - @astrojs/ts-plugin@0.4.1

## 0.29.0

### Minor Changes

- c8cdef9: Improved support for `.astro` imports inside JavaScript/TypeScript files:
  - Added support for finding file references inside Astro files
  - Added support for path completions for .astro, .md and .mdx files
  - Fixed cases where our TypeScript plugin would fail to load under certain circumstance
  - Fixed certain cases where Go to definition / implementation would fail
- 291ff7c: Migrate the language-server to use a new TSX output using the Astro compiler. This should make things such as autocomplete and hover information much more accurate, in addition to bringing support for numerous Astro features that were previously not working (such as support for the shorthand syntax for props, support for `is:raw` and more!)

### Patch Changes

- Updated dependencies [c8cdef9]
  - @astrojs/ts-plugin@0.4.0

## 0.28.3

### Patch Changes

- 6fecee2: Update Prettier plugin to 0.7.0

## 0.28.2

### Patch Changes

- 1f9ecaa: Fix numbers inside HTML attributes not being properly highlighted

## 0.28.1

### Patch Changes

- c2a6829: Update Prettier plugin to 0.6.0

## 0.28.0

### Minor Changes

- 4eeb0f3: Fix numerous issues related to file renames, deletes and moves not being properly caught by the extension and resulting in false positives
- 9b559ca: Add support for getting updated code from unsaved Astro, Svelte and Vue files

### Patch Changes

- 7492907: Add support for import completions of .md, .mdx and .html files
- 8d352de: Fix Organize Imports sometimes adding code to script tags
- f4a8513: Fix completions of component props not working if a CSS file was imported before the component

## 0.27.0

### Minor Changes

- a88e58b: Add support for Go to References
- 796d2d2: Add support for finding file references (Right click about anywhere / Command > Astro: Find File References"
- 2a8fba0: Add support for Go to Implementation inside Astro files

### Patch Changes

- a3daea4: Improve completions on the Fragment element, add completions for slot on components
- 8582a3d: Add support for syntax highlighting for event handlers

## 0.26.2

### Patch Changes

- a8ea743: Empty changeset for failed deploy

## 0.26.1

### Patch Changes

- c4f7a36: Trying desesperately to figure deployment out

## 0.26.0

### Minor Changes

- c4f7a36: Update language-server

## 0.24.4

### Patch Changes

- 96957ac: Fix extension not working properly inside the browser

## 0.24.3

### Patch Changes

- 7390abe: We're in deploy hell, but this time it'll work

## 0.24.2

### Patch Changes

- 6b2ca00: Retry deploy again

## 0.24.1

### Patch Changes

- 180ade5: Empty changeset for failed publish

## 0.24.0

### Minor Changes

- b66ae70: Update the VS Code extension to use a bundled version of the language server for better performance and compatibility with running the extension in the web
- 5a583d3: TypeScript will now be loaded from VS Code / the workspace instead of being bundled inside the language server

### Patch Changes

- Updated dependencies [b66ae70]
  - @astrojs/ts-plugin@0.3.0

## 0.23.3

### Patch Changes

- 150946c: Publish failed
- Updated dependencies [150946c]
  - @astrojs/language-server@0.23.3

## 0.23.2

### Patch Changes

- Updated dependencies [b13fb51]
  - @astrojs/language-server@0.23.2

## 0.23.1

### Patch Changes

- Updated dependencies [422376e]
  - @astrojs/language-server@0.23.1

## 0.23.0

### Patch Changes

- 56c14f8: Fix a regression with how VS Code handle unbalanced brackets since 1.70
- Updated dependencies [b6c95f2]
- Updated dependencies [1dcef68]
  - @astrojs/language-server@0.23.0

## 0.22.0

### Patch Changes

- f3777ac: Added settings to configure the path to the language server and the runtime to use to run it
- Updated dependencies [61620f1]
- Updated dependencies [9337f00]
- Updated dependencies [d5aafc0]
  - @astrojs/language-server@0.22.0

## 0.21.1

### Patch Changes

- Updated dependencies [0e9d7d0]
- Updated dependencies [3f79dbf]
  - @astrojs/language-server@0.21.1

## 0.21.0

### Minor Changes

- 574b75d: Remove support for the Markdown component

### Patch Changes

- 81f3aa5: Added a debug command to show the currently opened document's TSX output
- Updated dependencies [81f3aa5]
- Updated dependencies [574b75d]
- Updated dependencies [d23ba22]
  - @astrojs/language-server@0.21.0

## 0.20.4

### Patch Changes

- a3a13d1: Fix extension failing to send a notification when ts|jsconfig.json was updated
- a04124c: Fixed syntax highlighting not working properly for components with @, \_ and . in them

## 0.20.3

### Patch Changes

- Updated dependencies [081cf24]
  - @astrojs/language-server@0.20.3

## 0.20.2

### Patch Changes

- bd47f6e: Fix changes to an Astro config file causing the extension to crash, fixed JSON modules not being updated properly

## 0.20.1

### Patch Changes

- Updated dependencies [e6996f5]
- Updated dependencies [4589c2b]
  - @astrojs/language-server@0.20.1

## 0.20.0

### Patch Changes

- Updated dependencies [fa3f0f7]
- Updated dependencies [ba0fab1]
  - @astrojs/language-server@0.20.0

## 0.19.6

### Patch Changes

- Updated dependencies [4c1045d]
  - @astrojs/language-server@0.19.6

## 0.19.5

### Patch Changes

- 421ab52: Added a new setting (`astro.typescript.allowArbitraryAttributes`) to enable support for arbitrary attributes
- Updated dependencies [421ab52]
- Updated dependencies [06e3c95]
- Updated dependencies [301dcfb]
- Updated dependencies [dd1283b]
  - @astrojs/language-server@0.19.5

## 0.19.4

### Patch Changes

- Updated dependencies [1033856]
  - @astrojs/language-server@0.19.4

## 0.19.3

### Patch Changes

- Updated dependencies [49ff4ef]
- Updated dependencies [14cbf05]
  - @astrojs/language-server@0.19.3

## 0.19.2

### Patch Changes

- Updated dependencies [7de4967]
  - @astrojs/language-server@0.19.2

## 0.19.1

### Patch Changes

- 59e8ad6: Update README, disable frontmatter indenting by default
- fec2817: Improved syntax highlighting, auto-indentation and auto-closing
- Updated dependencies [729dff5]
- Updated dependencies [05a48c2]
- Updated dependencies [fe2d26b]
  - @astrojs/language-server@0.19.1

## 0.19.0

### Minor Changes

- a97b9a4: Add support for Inlay Hints. Minimum VS Code version supported starting from this update is 1.67.0 (April 2022)

### Patch Changes

- Updated dependencies [a97b9a4]
  - @astrojs/language-server@0.19.0

## 0.18.1

### Patch Changes

- 666739a: Revert update to latest LSP and inlay hints support
- Updated dependencies [666739a]
  - @astrojs/language-server@0.18.1

## 0.18.0

### Minor Changes

- d3c6fd8: Add support for formatting
- 09e1163: Updated language server to latest version of LSP, added support for Inlay Hints

### Patch Changes

- Updated dependencies [d3c6fd8]
- Updated dependencies [09e1163]
- Updated dependencies [fcaba8e]
- Updated dependencies [4138005]
- Updated dependencies [76ff46a]
  - @astrojs/language-server@0.18.0

## 0.17.0

### Patch Changes

- Updated dependencies [3ad0f65]
- Updated dependencies [2e9da14]
  - @astrojs/language-server@0.17.0

## 0.16.1

### Patch Changes

- Updated dependencies [ad5a5e5]
- Updated dependencies [1bd790d]
  - @astrojs/language-server@0.16.1

## 0.16.0

### Patch Changes

- 1bcae45: Remove support for Node 12 (VS Code versions under 1.56)
- Updated dependencies [b485acd]
- Updated dependencies [1cff04c]
- Updated dependencies [1bcae45]
- Updated dependencies [9abff62]
- Updated dependencies [c8d81a1]
  - @astrojs/language-server@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [7978de1]
- Updated dependencies [3ac74bc]
- Updated dependencies [6bb45cb]
  - @astrojs/language-server@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies [9118c46]
- Updated dependencies [9ea5b97]
- Updated dependencies [dbf624a]
  - @astrojs/language-server@0.14.0

## 0.13.4

### Patch Changes

- 74c9961: Fixed Astro syntax to detect `<Markdown />` component correctly
- Updated dependencies [5874655]
  - @astrojs/language-server@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies [1fb21ff]
- Updated dependencies [99d7536]
- Updated dependencies [b363c00]
  - @astrojs/language-server@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [aff8b76]
  - @astrojs/language-server@0.13.2

## 0.13.1

### Patch Changes

- ea74fdb: Publish failed
- Updated dependencies [ea74fdb]
  - @astrojs/language-server@0.13.1

## 0.13.0

### Minor Changes

- 82b8891: Add HTML hover info, fix Astro directives producing errors, fix missing children property for JSX based frameworks

### Patch Changes

- Updated dependencies [9f4f907]
- Updated dependencies [82b8891]
- Updated dependencies [c09116f]
  - @astrojs/language-server@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies [49955c6]
  - @astrojs/language-server@0.12.1

## 0.12.0

### Minor Changes

- 8a58a56: Refactor the language-server, fixes many issues related to imports, add support for completions in multiple style tags

### Patch Changes

- Updated dependencies [8a58a56]
  - @astrojs/language-server@0.12.0

## 0.11.0

### Patch Changes

- d056cd5: Fixes production bugs in extension
- Updated dependencies [d056cd5]
- Updated dependencies [fd92a85]
  - @astrojs/language-server@0.11.0
  - @astrojs/ts-plugin@0.2.1

## 0.9.3

### Patch Changes

- c4d43b4: Deploy to OpenVSX
- Updated dependencies [c4d43b4]
  - @astrojs/language-server@0.9.3

## 0.9.2

### Patch Changes

- 91404d1: Enable publishing to OpenVSX
- Updated dependencies [91404d1]
  - @astrojs/language-server@0.9.2

## 0.9.1

### Patch Changes

- 7dc85cc: Add support for Emmet inside components, upgrade Emmet version
- Updated dependencies [7dc85cc]
  - @astrojs/language-server@0.9.1

## 0.9.0

### Minor Changes

- 6b6b47a: Remove internal astro.d.ts files, instead prefer the one provided by Astro itself

### Patch Changes

- Updated dependencies [6b6b47a]
  - @astrojs/language-server@0.9.0
  - @astrojs/ts-plugin@0.2.0

## 0.8.10

### Patch Changes

- 8878324: Add feature to reload language server on ts/jsconfig change
- Updated dependencies [5b16fb4]
  - @astrojs/language-server@0.8.10

## 0.8.9

### Patch Changes

- Updated dependencies [d0485a2]
  - @astrojs/language-server@0.8.9

## 0.8.8

### Patch Changes

- Updated dependencies [526d5c7]
  - @astrojs/language-server@0.8.8

## 0.8.7

### Patch Changes

- Updated dependencies [897ab35]
  - @astrojs/language-server@0.8.7

## 0.8.6

### Patch Changes

- Updated dependencies [97559b6]
- Updated dependencies [4c93d24]
  - @astrojs/language-server@0.8.6

## 0.8.5

### Patch Changes

- f1f3091: Fix commenting, namespaced elements, and Fragment typings
- Updated dependencies [f1f3091]
  - @astrojs/language-server@0.8.5
  - @astrojs/ts-plugin@0.1.1

## 0.8.4

### Patch Changes

- Updated dependencies [481e009]
  - @astrojs/language-server@0.8.4

## 0.8.3

### Patch Changes

- cad5430: Fix plain script and style blocks
- Updated dependencies [fef3091]
  - @astrojs/language-server@0.8.3

## 0.8.2

### Patch Changes

- a408131: Several fixes for the syntax highlighter
- Updated dependencies [528c6bd]
  - @astrojs/language-server@0.8.2

## 0.8.1

### Patch Changes

- Updated dependencies [b20db6e]
  - @astrojs/language-server@0.8.1

## 0.8.0

### Minor Changes

- cf48420: Adds syntax highlighting support for Astro fenced codeblocks in all Markdown files

## 0.7.20

### Patch Changes

- 5034f23: Adds support for running as a [Web Extension](https://code.visualstudio.com/api/extension-guides/web-extensions)

## 0.7.19

### Patch Changes

- 2910b03: Add support for at-prefixed attributes
- Updated dependencies [2910b03]
  - @astrojs/language-server@0.7.19

## 0.7.18

### Patch Changes

- Updated dependencies [12b4ed3]
  - @astrojs/language-server@0.7.18

## 0.7.17

### Patch Changes

- Updated dependencies [7c6f6a6]
  - @astrojs/language-server@0.7.17

## 0.7.16

### Patch Changes

- Updated dependencies [b6f44d4]
- Updated dependencies [4166283]
  - @astrojs/language-server@0.7.16

## 0.7.15

### Patch Changes

- Updated dependencies [6340a79]
  - @astrojs/language-server@0.7.15

## 0.7.14

### Patch Changes

- Updated dependencies [e0facf6]
- Updated dependencies [3c903c3]
- Updated dependencies [b0a8bc1]
  - @astrojs/language-server@0.7.14

## 0.7.13

### Patch Changes

- Updated dependencies [1b2afc7]
  - @astrojs/language-server@0.7.13

## 0.7.12

### Patch Changes

- Updated dependencies [553969e]
- Updated dependencies [b4c1b70]
  - @astrojs/language-server@0.7.12

## 0.7.11

### Patch Changes

- Updated dependencies [02bcb91]
  - @astrojs/language-server@0.7.11

## 0.7.10

### Patch Changes

- Updated dependencies [1958d51]
- Updated dependencies [f558e54]
  - @astrojs/language-server@0.7.10

## 0.7.9

### Patch Changes

- Updated dependencies [6c952ae]
  - @astrojs/language-server@0.7.9

## 0.7.8

### Patch Changes

- Updated dependencies [f2f7fc8]
  - @astrojs/language-server@0.7.8

## 0.7.7

### Patch Changes

- Updated dependencies [6501757]
  - @astrojs/language-server@0.7.7

## 0.7.6

### Patch Changes

- Updated dependencies [ea2d56d]
  - @astrojs/language-server@0.7.6

## 0.7.4

### Patch Changes

- Updated dependencies [6604c9f]
  - @astrojs/language-server@0.7.4

## 0.7.3

### Patch Changes

- ae4a9e5: Provides special highlighting for component names
- Updated dependencies [8f7bd34]
  - @astrojs/language-server@0.7.3

## 0.7.2

### Patch Changes

- 1b3a832: Adds diagnostics (errors and warnings)
- Updated dependencies [1b3a832]
  - @astrojs/language-server@0.7.2

## 0.7.1

### Patch Changes

- Updated dependencies [7874c06]
  - @astrojs/language-server@0.7.1

## 0.7.1

### Patch Changes

- 25a7f22: Publishing new version

## 0.7.0

### Patch Changes

- Updated dependencies [72d3ff0]
  - @astrojs/language-server@0.7.0

## 0.6.1

- Makes the v0.6.0 features actually work 😅

## 0.6.0

- Fixes bug with signature help not appearing in the component script section.
- Adds completion suggestions for `Astro.*` APIs in the component script.
- Adds support for Hover based hints in the component script section.
- Fixes bug with Go to Definition (cmd + click) for Components.

## 0.5.0

- Bug fixes, dependency updates

## 0.4.3

### Patch Changes

- Improve support for <Markdown> component
- Bug fixes and improvements

## 0.4.2

### Patch Changes

- b3886c2: Added support for new <Markdown> component

## 0.4.1

### Patch Changes

- Updated VS Code Marketplace banner

## 0.4.0

### Minor Changes

- 06e2597: Adds support for import suggestions

### Patch Changes

- Updated dependencies [06e2597]
  - astro-languageserver@0.4.0
