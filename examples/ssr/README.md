# Astro SSR Example

```sh
npm create astro@latest -- --template ssr
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/ssr)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/ssr)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/ssr/devcontainer.json)

This example showcases server-side rendering with Astro using the [`@astrojs/node`](https://docs.astro.build/en/guides/integrations-guide/node/) adapter and [`@astrojs/svelte`](https://docs.astro.build/en/guides/integrations-guide/svelte/) integration.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   └── images/
├── src/
│   ├── components/
│   ├── models/
│   ├── pages/
│   │   ├── api/
│   │   └── products/
│   ├── styles/
│   └── api.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name. Dynamic routes like `products/[id].astro` are used to render individual product pages.

There's nothing special about `src/components/`, but that's where we like to put any Astro or framework components.

Any static assets, like images, can be placed in the `public/` directory.

## Server-side rendering (SSR)

This project uses the [`@astrojs/node`](https://docs.astro.build/en/guides/integrations-guide/node/) adapter with `output: "server"` to render pages on demand and expose API routes from `src/pages/api/`.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run server`          | Run the built Node server from `./dist/server/`  |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
