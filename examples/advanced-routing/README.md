# Astro Advanced Routing Example

```sh
npm create astro@latest -- --template advanced-routing
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/advanced-routing)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/advanced-routing)

This example showcases Astro's experimental advanced routing with `src/app.ts`, using [Hono](https://hono.dev/) middleware to control the request pipeline.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── src/
│   ├── actions/
│   ├── layouts/
│   ├── pages/
│   │   ├── dashboard/
│   │   └── es/
│   └── app.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

The `src/app.ts` file controls the request pipeline. This example composes Astro's middleware with custom Hono middleware to handle routing behavior like authentication, redirects, and locale-specific pages.

## Server-side rendering (SSR)

This project uses the [`@astrojs/node`](https://docs.astro.build/en/guides/integrations-guide/node/) adapter with `output: "server"` and enables Astro's experimental `advancedRouting` option.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
