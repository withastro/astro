# Astro Language Tools

This repository contains all the editor tooling required for the [Astro](https://astro.build/) language (`.astro` files).

Notably, it contains an implementation of the [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/) which as of now is used for the [official VSCode Extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode) but could also be used to power a plugin for your favorite IDE in the future.

## Packages

This repository is a monorepo managed through [Turbo](https://turborepo.org/), which means that multiple packages are in this same repo (`packages` folder), here's a list:

### [`@astrojs/language-server`](packages/language-server)

The Astro language server, its structure is inspired by the [Svelte Language Server](https://github.com/sveltejs/language-tools).

### [`astro-vscode`](packages/vscode)

The official VS Code extension for Astro. This enables all of the editing features you depend on in VSCode for `.astro` files

### [`@astrojs/ts-plugin`](packages/ts-plugin)

TypeScript plugin to add support for `.astro` imports in `.ts` files with proper typing

### Features provided

These packages power editing functionality such as:

* [Go to Definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition)
* Code hover hints
* Code completion
* Function signatures
* Syntax highlighting
* Code folding
* Emmet

## Contributing

Pull requests of any size and any skill level are welcome, no contribution is too small. Changes to the Astro Language Tools are subject to [Astro Governance](https://github.com/withastro/astro/blob/main/GOVERNANCE.md) and should adhere to the [Astro Style Guide](https://github.com/withastro/astro/blob/main/STYLE_GUIDE.md)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for instructions on how to setup your development environnement

## Sponsors

You can sponsor Astro's development on [Open Collective](https://opencollective.com/astrodotbuild). Astro is generously supported by the following companies and individuals:

### Platinum Sponsors

<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://www.netlify.com/#gh-light-mode-only" target="_blank"><img width="147" height="40" src="https://raw.githubusercontent.com/withastro/astro/main/.github/assets/netlify.svg#gh-light-mode-only" alt="Netlify" /></a><a href="https://www.netlify.com/#gh-dark-mode-only" target="_blank"><img width="147" height="40" src="https://raw.githubusercontent.com/withastro/astro/main/.github/assets/netlify-dark.svg#gh-dark-mode-only" alt="Netlify" />
      </a></td>
      <td align="center"><a href="https://www.vercel.com/#gh-light-mode-only" target="_blank"><img width="150" height="34" src="https://raw.githubusercontent.com/withastro/astro/main/.github/assets/vercel.svg#gh-light-mode-only" alt="Vercel" /></a><a href="https://www.vercel.com/#gh-dark-mode-only"><img width="150" height="34" src="https://raw.githubusercontent.com/withastro/astro/main/.github/assets/vercel-dark.svg#gh-dark-mode-only" alt="Vercel" />
      </a></td>
    </tr>
  </tbody>
</table>

### Gold Sponsors

<table>
  <tbody>
    <tr>
      <td align="center">
        <a href="https://divRIOTS.com#gh-light-mode-only" target="_blank">
        <img width="150" height="40" src="https://raw.githubusercontent.com/withastro/astro/main/.github/assets/divriots.svg#gh-light-mode-only" alt="‹div›RIOTS" />
        </a>
        <a href="https://divRIOTS.com#gh-dark-mode-only" target="_blank">
        <img width="150" height="40" src="https://raw.githubusercontent.com/withastro/astro/main/.github/assets/divriots-dark.svg#gh-dark-mode-only" alt="‹div›RIOTS" />
        </a>
      </td>
      <td align="center">
        <a href="https://stackupdigital.co.uk/#gh-light-mode-only" target="_blank">
        <img width="162" height="40" src="https://raw.githubusercontent.com/withastro/astro/main/.github/assets/stackup.svg#gh-light-mode-only" alt="StackUp Digital" />
        </a>
        <a href="https://stackupdigital.co.uk/#gh-dark-mode-only" target="_blank">
        <img width="130" height="32" src="https://raw.githubusercontent.com/withastro/astro/main/.github/assets/stackup-dark.svg#gh-dark-mode-only" alt="StackUp Digital" />
        </a>
      </td>
    </tr>
  </tbody>
</table>

### Sponsors

<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://sentry.io" target="_blank"><img width="147" height="40" src="https://raw.githubusercontent.com/withastro/astro/main/.github/assets/sentry.svg" alt="Sentry" /></a></td><td align="center"><a href="https://qoddi.com" target="_blank"><img width="147" height="40" src="https://devcenter.qoddi.com/wp-content/uploads/2021/11/blog-transparent-logo-1.png" alt="Qoddi App Platform" /></a></td>
    </tr>
  </tbody>
</table>
