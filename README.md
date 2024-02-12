# Astro Language Tools

This repository contains all the editor tooling required for the [Astro](https://astro.build/) language (`.astro` files).

Notably, it contains an implementation of the [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/) which as of now is used for the [official VSCode Extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode) but could also be used to power a plugin for your favorite IDE in the future.

## Packages

This repository is a monorepo managed through [Turbo](https://turborepo.org/), which means that multiple packages are in this same repo (`packages` folder), here's a list:

### [`@astrojs/language-server`](packages/language-server)

The Astro language server, powered by [Volar](https://volarjs.dev/).

### [`astro-vscode`](packages/vscode)

The official VS Code extension for Astro. This enables all of the editing features you depend on in VSCode for `.astro` files

### [`@astrojs/ts-plugin`](packages/ts-plugin)

TypeScript plugin to add support for `.astro` imports in `.ts` files with proper typing

### Features provided

These packages together power editing functionality such as:

- [Go to Definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition)
- Code hover hints
- Code completion
- Function signatures
- Syntax highlighting
- Code folding
- Emmet

For a full list of features, see [the VS Code's extension README](./packages/vscode/README.md#features).

## Contributing

Pull requests of any size and any skill level are welcome, no contribution is too small. Changes to the Astro Language Tools are subject to [Astro Governance](https://github.com/withastro/.github/blob/main/GOVERNANCE.md) and should adhere to the [Astro Style Guide](https://github.com/withastro/astro/blob/main/STYLE_GUIDE.md)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for instructions on how to setup your development environment

## Sponsors

Astro is generously supported by Netlify, Storyblok, and several other amazing organizations.

[❤️ Sponsor Astro! ❤️](https://github.com/withastro/.github/blob/main/FUNDING.md)

<p align="center">
  <a target="_blank" href="https://github.com/sponsors/withastro">
    <img alt="sponsors" src="https://astro.build/sponsors.png">
  </a>
</p>
