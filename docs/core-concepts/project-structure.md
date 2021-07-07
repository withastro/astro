---
layout: ~/layouts/Main.astro
title: Project Structure
---

Astro includes an opinionated folder layout for your project. Every Astro project must include these directories and files:

- `src/*` - Your project source code (components, pages, etc.)
- `public/*` - Your non-code assets (fonts, icons, etc.)
- `package.json` - A project manifest.

The easiest way to set up your new project is with `npm init astro`. Check out our [Installation Guide](/docs/quick-start.md) for a walkthrough of how to set up your project automatically (with `npm init astro`) or manually.

## Project Structure

```
├── src/
│   ├── components/
│   ├── layouts/
│   └── pages/
│       └── index.astro
├── public/
└── package.json
```

### `src/`

The src folder is where most of your project source code lives. This includes:

- [Astro Components](/docs/core-concepts/astro-components.md)
- [Pages](/docs/core-concepts/astro-pages.md)
- [Markdown](/docs/core-concepts/astro-pages.md)
- [Layouts](/docs/core-concepts/astro-pages.md)
- [Frontend JS Components](/docs/core-concepts/component-hydration.md)
- [Styling (CSS, Sass)](/docs/guides/styling.md)

Astro has complete control over how these files get processed, optimized, and bundled in your final site build. Some files (like Astro components) never make it to the browser directly and are instead rendered to HTML. Other files (like CSS) are sent to the browser but may be bundled with other CSS files depending on how your site uses.

### `src/components`

[Components](/docs/core-concepts/astro-components.md) are reusable units of UI for your HTML pages. It is recommended (but not required) that you put your components in this directory. How you organize them within this directory is up to you.

Your non-Astro UI components (React, Preact, Svelte, Vue, etc.) can also live in the `src/components` directory. Astro will automatically render all components to HTML unless you've enabled a frontend component via partial hydration.

### `src/layouts`

[Layouts](/docs/core-concepts/layouts.md) are reusable components for HTML page layouts. It is recommended (but not required) that you put your layout components in this directory. How you organize them within this directory is up to you.

### `src/pages`

[Pages](/docs/core-concepts/astro-pages.md) contain all pages (`.astro` and `.md` supported) for your website. It is **required** that you put your pages in this directory.

### `public/`

For most users, the majority of your files will live inside of the `src/` directory so that Astro can properly handle and optimize them in your final build. By contrast, the `public/` directory is the place for any files to live outside of the Astro build process.

If you put a file into the public folder, it will not be processed by Astro. Instead it will be copied into the build folder untouched. This can be useful for assets like images and fonts, or when you need to include a specific file like `robots.txt` or `manifest.webmanifest`.
