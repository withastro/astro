# Astro Starter Kit: Content

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

This starter demos **[the experimental Content Collections API](https://docs.astro.build/en/guides/content-collections)**.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```sh
/
├── .astro/ # Generated on build
├── public/
├── src/
│   └── content/
│       └── blog/
│           ├── first.md
│           └── second.md
│       └── config.ts
│   └── pages/
│       ├── [...slug].astro
│       └── index.astro
└── package.json
```

`src/content/` contains "collections" of Markdown or MDX documents for you to query. Astro will generate a `getCollection` function to retrieve posts from `src/content/`, and type-check your frontmatter using an optional schema (see `src/content/config.ts`).

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
