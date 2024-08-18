# astro-vscode

## 2.14.1

### Patch Changes

- 28dfebe: Updates to the stable version of Volar 2.4.0

## 2.14.0

### Minor Changes

- d624646: Adds support for Content Collection Intellisense

## 2.13.4

### Patch Changes

- e5732ff: Updates internal dependencies

## 2.13.3

### Patch Changes

- 5186329: Update internal dependencies

## 2.13.2

### Patch Changes

- e8e18a8: Fixes an issue where errors inside script and style tags could be offset by a few characters when multi bytes characters were present in the file

## 2.13.1

### Patch Changes

- cc94bef: Revert a change to top-level returns that could prevent the return types of functions from being correct in certain cases

## 2.13.0

### Minor Changes

- b65d6b4: Adds support for SCSS and LESS intellisense inside style tags

### Patch Changes

- 3a60f00: Fixes code lens on `Astro.glob` not working as expected

## 2.12.8

### Patch Changes

- 7733a56: Revert changes to Emmet completions, it was generating the wrong completions in certain cases

## 2.12.7

### Patch Changes

- 0a46801: Fixes a regression where errors could wrongly show (or not show) inside scripts and style tags
- 72f61e1: Fixes Emmet completions sometimes showing in places they shouldn't

## 2.12.6

### Patch Changes

- adc8d53: Try to publish again

## 2.12.5

### Patch Changes

- 91e77e1: Try publishing - a fourth time

## 2.12.4

### Patch Changes

- de10bb2: Try publishing - a third time

## 2.12.3

### Patch Changes

- a360c7e: Second attempt at publishing

## 2.12.2

### Patch Changes

- 7938491: Fixes publishing

## 2.12.1

### Patch Changes

- 708167e: Fixes script and style tags being wrongfully included in the generated TSX

## 2.12.0

### Minor Changes

- d993c0d: Improves the handling of script and style tags. This release fixes numerous issues where the presence of those tags could break intellisense in certain parts of the file.

### Patch Changes

- aae45af: Updates `prettier-plugin-astro` to 0.14.1

## 2.11.0

### Minor Changes

- b8a6af3: Upgrades to the latest version of Volar, the underlying framework powering the Astro language server. This update should fix some of the recent issues regarding intellisense inside script tags.

### Patch Changes

- 829093f: Add syntax highlighting for `astro` tagged code block inside MDX files.

## 2.10.2

### Patch Changes

- a8d8804: Second attempt at fixing publishing for OpenVSX

## 2.10.1

### Patch Changes

- 5f4541d: Fixes broken release on OpenVSX

## 2.10.0

### Minor Changes

- c8af6db: Upgrades the language server to use the latest version of Volar. This changes should have no negative impacts on the experience.

## 2.9.1

### Patch Changes

- a401068: Fixes certain code actions corrupting Vue and Svelte files in specific situations

## 2.9.0

### Minor Changes

- 65d3425: Upgrades the language server to use Volar 2.2. This changes should have no negative impacts on the experience.

## 2.8.6

### Patch Changes

- 85a47b3: Fixes commenting shortcut not using the proper comments inside expressions in certain cases

## 2.8.5

### Patch Changes

- 8e55c37: Fixes attributes for HTML events (onload, onclick etc) using the wrong highlighting for interpolated attributes

## 2.8.4

### Patch Changes

- 9ca368b: Update to the latest version of Volar. This release should fix some of the caching issues that has crept up recently
- d57daad: Fix notification about Prettier being missing appearing on every format
- b166787: Fixes auto imports through completions and code actions inside script tags sometimes not updating the text correctly
- eb49fb2: Fixes completions for Astro-specific attributes not working in certain contexts

## 2.8.3

### Patch Changes

- c1fa115: Fixes `.prettierignore` and `.editorconfig` not working correctly. This update also improves the error logging around Prettier, the LSP will now warn when it failed to load the Prettier config.

## 2.8.2

### Patch Changes

- 79b7968: Fixes Organize Imports not working correctly
- db49ff7: Fixes `text.astro` TextMate scope not being applied to top-level text nodes.

## 2.8.1

### Patch Changes

- 15c9455: Fixes HTML Entities (ex: `&lt;`) not being highlighted like they would inside HTML files
- f1447ef: chore: Update `volar-service-prettier`. This is only an internal refactor and there should be no visible changes.

## 2.8.0

### Minor Changes

- 85b42dc: Update to the latest version of Volar. This release fixes a few issues such as missing Prettier crashing the language server in some cases, resolutions not working correctly inside TSX files, and more.

## 2.7.7

### Patch Changes

- 1b68dfb: Improves descriptions for attributes specific to Astro (`is:raw`, `set:html`, etc.)

## 2.7.5

### Patch Changes

- 7c4c1f2: Update Volar services. This update fixes an issue where `typescript.validate` settings wouldn't work in Astro files the same way they would inside TypeScript files
- 1436e6e: Fixes mapping from compiler location to LSP range.

## 2.7.4

### Patch Changes

- 6924c7e: Fixes semantic highlighting not working inside .ts(x) files in certain cases
- 310fbfe: Fix Svelte and Vue integrations not working on Windows in certain cases

## 2.7.3

### Patch Changes

- de58706: Fix imports from certain packages not working correctly in certain cases

## 2.7.1

### Patch Changes

- 7b1ab72: Fix TypeScript not working inside script tags

## 2.7.0

### Minor Changes

- 15a5532: Upgrade to Volar 2.0. No regressions are currently expected, however as this is a fairly consequential backend change, please report any issues you encounter.

  For reference, Volar is the underlying framework that powers the Astro language server, you can think of it as Vite for editor tooling.

## 2.6.3

### Patch Changes

- a97c048: Adds a completion for `transition:persist`

## 2.6.2

### Patch Changes

- 63e2c81: Fix fallback types not being properly included in some contexts such as inside the VS Code extension

## 2.6.1

### Patch Changes

- 5cd3bae: Fix Astro types not working on version of Astro older than 4.0.8 when React types were installed

## 2.6.0

### Minor Changes

- dab6801: Enables more accurate types when using JSX-based frameworks. This internal refactor to Astro's JSX types will be an invisible change for most users, but fixes a number of type checking problems for users of other JSX frameworks.

## 2.5.6

### Patch Changes

- 37434ab: Fixes incorrectly highlighted escaped interpolation in template literal attributes

## 2.5.4

### Patch Changes

- 45d49f5: Fix errors spilling out of inline event attributes in certain cases
- 5013f2e: Fix autoclosing of brackets not working inside tags in certain cases

## 2.5.3

### Patch Changes

- 621320a: Fix language server crashing when encountering malformed files in certain cases
- dc98b0b: Fixes an issue where type checking errors were shown on define:vars scripts when "type=module" attribute was also present.
- 598689a: Improve detection of Astro in complex monorepos

## 2.5.2

### Patch Changes

- bd3d933: Fix formatting sometimes causing the code to become invalid inside inline events (onclick, onload...)
- ee41dce: Add support for TypeScript 5.3
- 19217c4: Automatically flatten inferred unions from `getStaticPaths` into each other so that divergent props don't need to be manually discriminated before destructuring.

## 2.5.1

### Patch Changes

- 89d4613: Show full reason why an editor integration might have failed loading

## 2.5.0

### Minor Changes

- f4402eb: Add intellisense for Astro.self, add auto inferring of props for `getStaticPaths`

## 2.4.1

### Patch Changes

- 0e9861e: Fix errors on JSON script tags
- bae3749: Fix usage of prettier plugins without prettier-plugin-astro

## 2.4.0

### Minor Changes

- 9381e1d: Update dependencies

## 2.3.4

### Patch Changes

- 4046fb8: Fix intellisense not working in nested script and style tags

## 2.3.3

### Patch Changes

- 351f5dd: Fix formatting not respecting Prettier overrides in certain cases

## 2.3.1

### Patch Changes

- 0a34d96: Use editor formatting settings as a fallback when there's no Prettier config
- 4e10283: Fix TSServer crash, for real this time

## 2.3.0

### Minor Changes

- 1bb48f4: Add completions snippets for getStaticPaths, the Props interface and prerender statements

### Patch Changes

- 2ac4220: Update to latest version of the Astro Prettier plugin
- 4b510dd: Fix TSServer crashing in certain situations
- cd0f5d5: Order `astro:*` completions higher than other completions
- 9759fdb: Fix wordpattern syntax in astro-language-configuration.json

## 2.1.4

### Patch Changes

- bb38a76: Fix formatting not working in certain situations

## 2.1.3

### Patch Changes

- 65fca95: Update Volar to latest version. This fixes resolving Astro files from `node_modules` and various other import errors.

## 2.1.2

### Patch Changes

- 2748230: Use configured tsdk
- ab8fd87: Add transition:name and transition:animate attributes

## 2.1.1

### Patch Changes

- 0725820: Attempt new release

## 2.1.0

### Minor Changes

- f9b2aea: The Astro TypeScript plugin is now powered by Volar! Much like our Volar-powered language server, this brings many improvement in stability, performance and in the future, will allow us to add more features to it much more easily than before.

### Patch Changes

- fa15d04: Properly treat script tags with type="module" as their own scope
- 1202c9d: Upgraded dependencies, added support for Prettier 3
- d71c081: Upgraded Volar version
- 6057e81: Significantly reduce the weight of the extension

## 2.0.18

### Patch Changes

- 60e4ce0: Fix packaging error causing TypeScript plugin to not work
- Updated dependencies [60e4ce0]
  - @astrojs/ts-plugin@1.0.10

## 2.0.17

### Patch Changes

- b6a98e0: Better handle when the Astro compiler fails to parse a file
- Updated dependencies [b6a98e0]
  - @astrojs/ts-plugin@1.0.9

## 2.0.16

### Patch Changes

- f72d8d2: Fix auto imports and quick fixes not working in certain situations
- 2b889dc: Update to latest version of Volar
- 170a193: Update dependencies
- Updated dependencies [170a193]
  - @astrojs/ts-plugin@1.0.8

## 2.0.15

### Patch Changes

- 9d1cd4d: Fix crash when a file named 404.astro was present in the project

## 2.0.14

### Patch Changes

- a8e39a9: Fix `astro.trace.server` not working
- 0205f03: Fixed TypeScript error showing when deconstructing from Astro.props a variable with the same name as the normalized file name

## 2.0.13

### Patch Changes

- ab364c5: Fix missing import in `client.ts`

## 2.0.0

### Major Changes

- 0c747db: The Astro VS Code extension and language server are now powered by Volar (https://volarjs.github.io/)! This updates massively improve performance and add numerous features such as selection ranges, document highlights, support for intellisense on inline JavaScript, CodeLens helper for `Astro.glob` and more.

In the background, this update means that we now have to maintain a lot less code ourselves, which means we'll be able to dedicate more time to offering fun, Astro-specific features instead of maintaining core features.

## 2.0.0-next.12

### Patch Changes

- b108370: Fix crash on empty glob pattern

## 2.0.0-next.11

### Patch Changes

- af88980: Fix packaging error

## 2.0.0-next.10

### Patch Changes

- d5e2d51: Fix certain types being wrongly included into projects
- d5e2d51: Added back "Select TypeScript version" command
- d5e2d51: Fix single quotes attributes breaking the syntax highlighting when inline HTML events were used

## 2.0.0-next.9

### Patch Changes

- 8b82179: Remove buggy links and paths completions on certain HTML attributes
- 8b82179: Fix color pickers not showing for inline styles (style attributes)
- 8b82179: Remove completion for certain irrelevant properties
- 8b82179: Fix signature helpers not working
- 8b82179: Fix auto imports and code actions not working under certain circumstances

## 2.0.0-next.8

### Patch Changes

- 5a4e068: Fix completions not appearing for Svelte and Vue components in certain cases
- 5a4e068: Fix Prettier config not being considered when formatting
- 5a4e068: Fix auto-imports and quickfixes sometimes not properly inserting the import

## 2.0.0-next.7

### Patch Changes

- df6cd5a: Fix crash at start

## 2.0.0-next.6

### Patch Changes

- 4038ca5: Attempt to solve crash in packaged version

## 2.0.0-next.5

### Patch Changes

- 77d74d9: Update Astro Prettier Plugin to 0.9.0

## 2.0.0-next.4

### Patch Changes

- f707876: Fix commands not working

## 2.0.0-next.3

### Patch Changes

- 46f321f: Fix packaging error, part 2

## 2.0.0-next.2

### Patch Changes

- fce2944: Fix publishing error

## 2.0.0-next.1

### Patch Changes

- 0cb6b9e: Publish pre-release to marketplace

## 2.0.0-next.0

### Major Changes

- The Astro VS Code extension and language server are now powered by Volar (https://volarjs.github.io/)! This updates massively improve performance and add numerous features such as selection ranges, document highlights, support for intellisense on inline JavaScript, CodeLens helper for `Astro.glob` and more.

In the background, this update means that we now have to maintain a lot less code ourselves, which means we'll be able to dedicate more time to offering fun, Astro-specific features instead of maintaining core features.

### Patch Changes

- Updated dependencies
  - @astrojs/language-server@2.0.0-next.0

## 1.0.8

### Patch Changes

- c6cf1d7: Update Prettier plugin version
- Updated dependencies [c6cf1d7]
  - @astrojs/ts-plugin@1.0.7

## 1.0.7

### Patch Changes

- e54ec6c: Update to prettier-plugin-astro@0.9.0

## 1.0.6

### Patch Changes

- 3fcbc1a: Fix TypeScript plugin crashing at start in certain circumstances
- Updated dependencies [3fcbc1a]
  - @astrojs/ts-plugin@1.0.6

## 1.0.5

### Patch Changes

- ae15420: Fix importing `.astro` files in `.ts` files not working with TypeScript 5.0+
- 841a761: Fix type for `scopeUri` in workspace/configuration request
- 4f7430b: Update `prettier-plugin-astro` to 0.8.1
- Updated dependencies [ae15420]
  - @astrojs/ts-plugin@1.0.5

## 1.0.4

### Patch Changes

- eaefe96: Fix packaging error
- Updated dependencies [eaefe96]
  - @astrojs/ts-plugin@1.0.4

## 1.0.3

### Patch Changes

- 685513b: Improve stability related to converting files to TSX
- Updated dependencies [685513b]
  - @astrojs/ts-plugin@1.0.3

## 1.0.0

### Major Changes

- 39a7669: 1.0! This release includes no new changes by itself, but symbolize the official release of what was previously the pre-release version of the extension. For changelogs, please refer to the changelog from `0.29.0` to now.

### Patch Changes

- Updated dependencies [39a7669]
  - @astrojs/ts-plugin@1.0.0

## 0.29.8

### Patch Changes

- 53ad6ce: Add file template snippets when opening a new file
- 8ff8bdf: Update compiler version to fix Windows mapping issue
- Updated dependencies [8ff8bdf]
  - @astrojs/ts-plugin@0.4.5

## 0.29.7

### Patch Changes

- 4e777bb: Update branded assets

## 0.29.6

### Patch Changes

- edccff6: Support workspace-local language server versions in the Visual Studio Code plugin
- c04adf3: Upgrade compiler version to 1.1.1
- Updated dependencies [c04adf3]
  - @astrojs/ts-plugin@0.4.4

## 0.29.5

### Patch Changes

- 59bfc7b: Fixed Astro commands showing even outside Astro files
- Updated dependencies [6b81412]
  - @astrojs/ts-plugin@0.4.3

## 0.29.4

### Patch Changes

- ad08f8e: Fix completions of strings not showing in certain cases
- 94a9b61: Add proper support for renaming symbols inside Astro (.astro) files
- ad08f8e: Add support for breakpoints
- Updated dependencies [94a9b61]
  - @astrojs/ts-plugin@0.4.2

## 0.29.3

### Patch Changes

- d8ba449: Fix Prettier plugins not being loaded when formatting

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
