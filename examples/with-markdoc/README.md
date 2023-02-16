# Astro Example: Markdoc (experimental)

This starter showcases the experimental Markdoc integration.

```
npm create astro@latest -- --template with-markdoc
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/with-markdoc)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/with-markdoc)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```
/
├── public/
├── src/
│   └── content/docs/
│       └── intro.mdoc
│   └── components/
│       └── DocsContent.astro
│   └── pages/
│       └── index.astro
└── package.json
```

Markdoc can be used in content collections with the `.mdoc` extension. See `content/docs/` for an example.

You can also apply Astro components and server-rendered UI components (React, Vue, Svelte, etc) to your Markdoc files. See `src/content/DocsContent.astro` for an example configuration.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`          | Installs dependencies                            |
| `npm run dev`          | Starts local dev server at `localhost:3000`      |
| `npm run build`        | Build your production site to `./dist/`          |
| `npm run preview`      | Preview your build locally, before deploying     |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `npm run astro --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
