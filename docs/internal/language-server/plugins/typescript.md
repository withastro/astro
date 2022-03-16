# TypeScript plugin

The [TypeScript plugin](/packages/language-server/src/plugins/typescript/) is by far the most complicated one out of our plugins, the major reason for it is that, well, it handle complicated things!

Unlike our other plugins that can rely on packages (such as `vscode-css-languageservice` and its HTML counterpart) made by Microsoft to facilitate integration of different languages, the TypeScript plugin mostly has to do everything itself with no helper apart from TypeScript itself

Understandably, TypeScript doesn't really understand what a [TextDocument](https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocuments) from a Language Server is, it also (very much understandably) does not understand what an Astro, Svelte or Vue file is. We can't really teach TypeScript how to process all of that, so instead, we try our best to give it information in formats it understand

## Classes

Some of it is just using different (but very similar) classes, for instance, instead of using [our set of Document-related classes](/packages/language-server/src/core/documents/), we instead use [DocumentSnapshot](/packages/language-server/src/plugins/typescript/DocumentSnapshot.ts). It uses similar methods and properties names to the previously mentionned Document classes, even inheriting from our classes in the case of `SnapshotFragment` but contain slight changes needed for TypeScript

## TSX Generation

Something that surprise a lot of people new to working on the language-server is that it (at least, currently) does not use the Astro compiler (nor the old Svelte-derived Astro parser). Instead, in order to get diagnostics, completions and other features from TypeScript, we [convert Astro files to TSX](/packages/language-server/src/plugins/typescript/astro2tsx.ts) and then give that to TypeScript

This process also happens for our framework integrations, for instance Svelte files are converted to TSX thanks to the `svelte2tsx` package (also used by the official Svelte language server for the same reason as us) in order to get props and diagnostics from them
