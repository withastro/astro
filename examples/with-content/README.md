# Astro Starter Kit: Content

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

This project is based on **[the Content Schema RFC](https://www.notion.so/astroinc/Content-Schemas-35f1952fb0a24b30b681b0509ac4d7c2)**. We suggest reading the intro and "detailed usage" sections to understand how content works.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```sh
/
├── .astro/ # Generated on build
├── public/
├── src/
│   └── content/
│       └── blog/
│           ├── ~schema.ts
│           ├── first.md
│           └── second.md
│   └── pages/
│       └── index.astro
└── package.json
```

`src/content/` contains "collections" of Markdown or MDX documents you'll use in your website. Astro will generate a `fetchContent` function to grab posts from `src/content/` (see the generated `.astro` directory), with type-checked frontmatter based on a schema.

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

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
