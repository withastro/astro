# Astro Starter Kit: Custom Framework / Custom Renderer Package

This is a template for an Astro integration that implements a custom renderer. Custom renderers can be used to add custom, 3rd-party framework support to Astro or to render custom markup that is returned by components (e.g. a custom headless CMS VDOM, and basically anything you can think of).

```sh
npm create astro@latest -- --template framework-custom
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/framework-custom)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/framework-custom)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/framework-custom/devcontainer.json)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── src/components/CustomRendererTest.ts
├── src/custom-renderer/client.ts
├── src/custom-renderer/index.ts
├── src/custom-renderer/server.ts
├── src/pages/index.astro
├── tsconfig.json
├── package.json
```

The `src/custom-renderer/index.ts` file is the "entry point" for your custom renderer integration. 
The default exported function is used in `src/astro.config.mjs` as an integration.

Client-side rendering of DOM sub-trees is implemented in `src/custom-renderer/client.ts` while
`src/custom-renderer/server.ts` implements SSR rendering (HTML serialized rendering).

The `src/pages/index.astro` demonstrates the various client directives to render Components
that use the custom framework/custom renderer and `src/components/CustomRendererTest.ts` implements 
one Component that shows the use of a custom markup/VDOM in use.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command       | Action                                                                                                                                                                                                                           |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm link`    | Registers this package locally. Run `npm link my-integration` in an Astro project to install your integration                                                                                                                    |
| `npm publish` | [Publishes](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages#publishing-unscoped-public-packages) this package to NPM. Requires you to be [logged in](https://docs.npmjs.com/cli/v8/commands/npm-adduser) |
