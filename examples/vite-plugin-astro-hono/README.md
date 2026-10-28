# Astro components in Hono

An Astro component with a React island, rendered by a [Hono](https://hono.dev) app in a plain Vite project. There is no `astro` package: `@astrojs/vite-plugin-astro` compiles the `.astro` files, and each Hono route renders a component with `renderToResponse()` from `@astrojs/runtime`.

- `vite.config.js` adds `astro({ renderers: [react()] })`, with the renderer from `@astrojs/react/renderer`, and `viteReact()` from `@vitejs/plugin-react` to compile the JSX.
- `src/app.ts` is the Hono app: `/` and `/hello/:name` render `src/components/Page.astro`.
- `src/components/Page.astro` has a scoped style and a `<Counter client:load />` island.

| Command      | Action                                                             |
| :----------- | :----------------------------------------------------------------- |
| `pnpm dev`   | Starts the app on Vite's dev server (`dev.mjs`)                    |
| `pnpm build` | Builds the app to `dist/server/` and its islands to `dist/client/` |
| `pnpm start` | Serves the build with `@hono/node-server` (`start.mjs`)            |
