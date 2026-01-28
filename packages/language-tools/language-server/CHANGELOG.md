# @astrojs/language-server

## 2.16.3

### Patch Changes

- [#15199](https://github.com/withastro/astro/pull/15199) [`d8e64ef`](https://github.com/withastro/astro/commit/d8e64ef77ef364b1541a5d192bcff299135d3bc8) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes the links to Astro Docs so that they match the current docs structure.

## 2.16.2

### Patch Changes

- [#14950](https://github.com/withastro/astro/pull/14950) [`385be1b`](https://github.com/withastro/astro/commit/385be1bc6e1ce3fd76b0c1076d489caeed5a35d3) Thanks [@dvelasquez](https://github.com/dvelasquez)! - Fixes an issue with the volar-service-emmet that was pointing to a github username/repository instead of a npm package. This type of dependencies are not supported for Deno installations and it can break in enterprise environments that use private registries or don't have access to public github.

## 2.16.1

### Patch Changes

- [#14740](https://github.com/withastro/astro/pull/14740) [`abfed97`](https://github.com/withastro/astro/commit/abfed97d45ab04c625d6463f9be1e5b1d23c3573) Thanks [@ArmandPhilippot](https://github.com/ArmandPhilippot)! - Fixes link targets in documentation following repository relocation.

## 2.16.0

### Minor Changes

- [#14584](https://github.com/withastro/astro/pull/14584) [`3c7ab17`](https://github.com/withastro/astro/commit/3c7ab178da26d095777495bcee94b468937936a3) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Adds a new setting for disabling the Auto Import Cache. The cache can cause an issue where new files are not able to be automatically imported using autocomplete in certain cases. Check https://github.com/withastro/astro/issues/14642 for more details.

## 2.15.5

### Patch Changes

- 2cbd3f6: Updates the autocomplete options for `export const prerender=` to remove `import.meta.env`, as this option was removed in Astro 4.14
- 6dfd814: Updated internal Volar version. This update should improve compatibility with newer versions of TypeScript and fix minor issues.

## 2.15.4

### Patch Changes

- 128cf11: Improves performance when using TS 5.6. Performance is still degraded compared to 5.5, but should at least be usable.
- Updated dependencies [128cf11]
  - @astrojs/yaml2ts@0.2.2

## 2.15.3

### Patch Changes

- 8673fa5: Fixes certain cases where content schemas would not be reloaded properly when they were updated

## 2.15.0

### Minor Changes

- 3a836de: Allow disabling the handling of updating imports when files are renamed. This is now disabled by default in VS Code, as the Astro TypeScript plugin will handle it correctly.

### Patch Changes

- 5a44072: Fixes formatting not working by default in certain circumstances

## 2.14.2

### Patch Changes

- af5bbc5: Fixes content intellisense not working inside Markdoc files using the `markdoc` language identifier

## 2.14.1

### Patch Changes

- 28dfebe: Updates to the stable version of Volar 2.4.0
- Updated dependencies [28dfebe]
  - @astrojs/yaml2ts@0.2.1

## 2.14.0

### Minor Changes

- d624646: Adds support for Content Collection Intellisense

### Patch Changes

- Updated dependencies [d624646]
  - @astrojs/yaml2ts@0.2.0

## 2.13.4

### Patch Changes

- e5732ff: Updates internal dependencies

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

## 2.12.1

### Patch Changes

- 708167e: Fixes script and style tags being wrongfully included in the generated TSX

## 2.12.0

### Minor Changes

- d993c0d: Improves the handling of script and style tags. This release fixes numerous issues where the presence of those tags could break intellisense in certain parts of the file.

### Patch Changes

- aae45af: Updates `prettier-plugin-astro` to 0.14.1

## 2.11.1

### Patch Changes

- 5eb20f2: Fixes installation on Yarn 4

## 2.11.0

### Minor Changes

- b8a6af3: Upgrades to the latest version of Volar, the underlying framework powering the Astro language server. This update should fix some of the recent issues regarding intellisense inside script tags.

## 2.10.0

### Minor Changes

- c8af6db: Upgrades the language server to use the latest version of Volar. This changes should have no negative impacts on the experience.

## 2.9.1

### Patch Changes

- a401068: Fixes certain code actions corrupting Vue and Svelte files in specific situations

## 2.9.0

### Minor Changes

- 65d3425: Upgrades the language server to use Volar 2.2. This changes should have no negative impacts on the experience.

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

## 2.8.1

### Patch Changes

- f1447ef: chore: Update `volar-service-prettier`. This is only an internal refactor and there should be no visible changes.

## 2.8.0

### Minor Changes

- 85b42dc: Update to the latest version of Volar. This release fixes a few issues such as missing Prettier crashing the language server in some cases, resolutions not working correctly inside TSX files, and more.

## 2.7.7

### Patch Changes

- 2bad6a8: Adds auto-complete for `data-astro-rerun` on script tags
- 1b68dfb: Improves descriptions for attributes specific to Astro (`is:raw`, `set:html`, etc.)

## 2.7.6

### Patch Changes

- fe6165b: Makes astro check --tsconfig understand relative file names

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

## 2.7.2

### Patch Changes

- a2280a8: Avoid checking Svelte and Vue files when running astro check

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

### Patch Changes

- a314bcc: Remove temporary workaround `astro check` that disabled checking JSX and TSX files

## 2.5.5

### Patch Changes

- b16fcbb: Temporarily disable checking `.jsx` and `.tsx` files using `astro check` until https://github.com/withastro/language-tools/issues/727 is fixed

## 2.5.4

### Patch Changes

- 45d49f5: Fix errors spilling out of inline event attributes in certain cases
- 7c9c981: Fix errors inside `.ts` files not being properly reported in certain cases

## 2.5.3

### Patch Changes

- 621320a: Fix language server crashing when encountering malformed files in certain cases
- dc98b0b: Fixes an issue where type checking errors were shown on define:vars scripts when "type=module" attribute was also present.
- 015a667: Fix ignored minimal severity flag
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

## 2.3.2

### Patch Changes

- 4115714: Fix logging severity filtering out diagnostics completely from results

## 2.3.1

### Patch Changes

- 0a34d96: Use editor formatting settings as a fallback when there's no Prettier config

## 2.3.0

### Minor Changes

- 1bb48f4: Add completions snippets for getStaticPaths, the Props interface and prerender statements

### Patch Changes

- 95e091c: Support prettier-plugin-astro v0.12 and higher in language-server
- cd0f5d5: Order `astro:*` completions higher than other completions

## 2.2.0

### Minor Changes

- 8ac32d9: Added several new options to the check entrypoint in order to support the new `@astrojs/check` package

## 2.1.4

### Patch Changes

- bb38a76: Fix formatting not working in certain situations

## 2.1.3

### Patch Changes

- 65fca95: Update Volar to latest version. This fixes resolving Astro files from `node_modules` and various other import errors.

## 2.1.2

### Patch Changes

- ab8fd87: Add transition:name and transition:animate attributes

## 2.1.0

### Minor Changes

- f9b2aea: The Astro TypeScript plugin is now powered by Volar! Much like our Volar-powered language server, this brings many improvement in stability, performance and in the future, will allow us to add more features to it much more easily than before.

### Patch Changes

- fa15d04: Properly treat script tags with type="module" as their own scope
- 1202c9d: Upgraded dependencies, added support for Prettier 3
- d71c081: Upgraded Volar version
- 6057e81: Significantly reduce the weight of the extension

## 2.0.17

### Patch Changes

- b6a98e0: Better handle when the Astro compiler fails to parse a file

## 2.0.16

### Patch Changes

- f72d8d2: Fix auto imports and quick fixes not working in certain situations
- 2b889dc: Update to latest version of Volar
- 170a193: Update dependencies

## 2.0.15

### Patch Changes

- 9d1cd4d: Fix crash when a file named 404.astro was present in the project

## 2.0.14

### Patch Changes

- 60500b3: pin the @volar/_ and volar-service-_ versions to avoid regression
- 5d10499: pin @volar/kit version
- 0205f03: Fixed TypeScript error showing when deconstructing from Astro.props a variable with the same name as the normalized file name

## 2.0.0

### Major Changes

- 0c747db: The Astro VS Code extension and language server are now powered by Volar (https://volarjs.github.io/)! This updates massively improve performance and add numerous features such as selection ranges, document highlights, support for intellisense on inline JavaScript, CodeLens helper for `Astro.glob` and more.

  In the background, this update means that we now have to maintain a lot less code ourselves, which means we'll be able to dedicate more time to offering fun, Astro-specific features instead of maintaining core features.

### Patch Changes

- 8b82179: Remove buggy links and paths completions on certain HTML attributes
- 8b82179: Fix color pickers not showing for inline styles (style attributes)
- 5a4e068: Fix completions not appearing for Svelte and Vue components in certain cases
- 5a4e068: Fix Prettier config not being considered when formatting
- d5e2d51: Fix certain types being wrongly included into projects
- 4038ca5: Attempt to solve crash in packaged version
- 8b82179: Remove completion for certain irrelevant properties
- af88980: Fix packaging error
- d5e2d51: Added back "Select TypeScript version" command
- df6cd5a: Fix crash at start
- 8b82179: Fix signature helpers not working
- b108370: Fix crash on empty glob pattern
- 8b82179: Fix auto imports and code actions not working under certain circumstances
- 5a4e068: Fix auto-imports and quickfixes sometimes not properly inserting the import

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

## 2.0.0-next.0

### Major Changes

- The Astro VS Code extension and language server are now powered by Volar (https://volarjs.github.io/)! This updates massively improve performance and add numerous features such as selection ranges, document highlights, support for intellisense on inline JavaScript, CodeLens helper for `Astro.glob` and more.

In the background, this update means that we now have to maintain a lot less code ourselves, which means we'll be able to dedicate more time to offering fun, Astro-specific features instead of maintaining core features.

## 1.0.8

### Patch Changes

- c6cf1d7: Update Prettier plugin version

## 1.0.5

### Patch Changes

- 841a761: Fix type for `scopeUri` in workspace/configuration request
- 4f7430b: Update `prettier-plugin-astro` to 0.8.1

## 1.0.4

### Patch Changes

- eaefe96: Fix packaging error

## 1.0.3

### Patch Changes

- 685513b: Improve stability related to converting files to TSX

## 1.0.0

### Major Changes

- 39a7669: 1.0! This release includes no new changes by itself, but symbolize the official release of what was previously the pre-release version of the extension. For changelogs, please refer to the changelog from `0.29.0` to now.

### Minor Changes

- c54458c: Add ability to resolve `astro` in pnp workspace

## 0.29.8

### Patch Changes

- 8ff8bdf: Update compiler version to fix Windows mapping issue

## 0.29.6

### Patch Changes

- c04adf3: Upgrade compiler version to 1.1.1

## 0.29.5

### Patch Changes

- 6b81412: Added an explanation on how to generate types for content collections to the error message for the `astro:content` import

## 0.29.4

### Patch Changes

- ad08f8e: Fix completions of strings not showing in certain cases
- 94a9b61: Add proper support for renaming symbols inside Astro (.astro) files

## 0.29.3

### Patch Changes

- d8ba449: Fix Prettier plugins not being loaded when formatting

## 0.29.1

### Patch Changes

- 985515d: Update `@astrojs/compiler`, fixing a few bugs

## 0.29.0

### Minor Changes

- 291ff7c: Migrate the language-server to use a new TSX output using the Astro compiler. This should make things such as autocomplete and hover information much more accurate, in addition to bringing support for numerous Astro features that were previously not working (such as support for the shorthand syntax for props, support for `is:raw` and more!)

## 0.28.3

### Patch Changes

- 6fecee2: Update Prettier plugin to 0.7.0

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

## 0.26.2

### Patch Changes

- a8ea743: Empty changeset for failed deploy

## 0.26.1

### Patch Changes

- c4f7a36: Trying desesperately to figure deployment out

## 0.26.0

### Patch Changes

- c4f7a36: Empty changeset for failed deploy

## 0.24.1

### Patch Changes

- 180ade5: Empty changeset for failed publish

## 0.24.0

### Minor Changes

- b66ae70: Update the VS Code extension to use a bundled version of the language server for better performance and compatibility with running the extension in the web
- 5a583d3: TypeScript will now be loaded from VS Code / the workspace instead of being bundled inside the language server

### Patch Changes

- 5146422: Fix <> inside the frontmatter preventing certain HTML features from working inside the template

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
