---
layout: ~/layouts/MainLayout.astro
title: Publish a Component to NPM
---

Built a great Astro component? **Publish it to [npm!](https://npmjs.com/)**

Once published to npm, Astro components can be installed and used in your project like any other npm package. npm is a great way to share Astro components across projects within your team, your company, or the entire world.

## Basic NPM Package Setup

Here's an example package that we'd like to publish to npm. It includes two Astro components and a few other files.

```
/my-components-package/
├── package.json
├── index.js
├── Capitalize.astro
└── Bold.astro
```

### `package.json`

Your package manifest. This includes information about your package such as name, description, any dependencies, and other important metadata. If you don't know what the `package.json` file is, we highly recommend you to have a quick read on [the npm documentation](https://docs.npmjs.com/creating-a-package-json-file).

When making a astro component use the `astro-component` keyword, this makes it easier for people to find your component.

We recommend that you define an [exports entry](https://nodejs.org/api/packages.html) for your `index.js` package entrypoint like so:

```json
{
  "name": "@example/my-components",
  "version": "0.0.1",
  "exports": "./index.js",
  "keywords": ["astro-component"]
}
```

### `index.js`

`index.js` is your package entrypoint, which is the file that gets loaded when someone imports your package by name. Having a JavaScript file as your package entrypoint will let you export multiple components and have better control over their exported component names.

```js
export { default as Capitalize } from './Capitalize.astro';
export { default as Bold } from './Bold.astro';
```

### Publishing

Once you have your package ready, you can publish it to npm by running the command `npm publish`. If that fails, make sure that you've logged in via `npm login` and that your package.json is correct.

Once published, anyone will be able to install your components and then import them like so:

```astro
---
import { Bold, Capitalize } from '@example/my-components';
---
<Capitalize phrase={`Hello world`} />
```

## Advanced

We recommend a single `index.js` package entrypoint because this is what most users are familiar with. However, in some rare scenarios you may want to have your users import each `.astro` component directly, in the same manner that you import `.astro` files in your own project.

```astro
---
import Capitalize from '@example/my-components/Capitalize.astro';
---
<Capitalize phrase={`Hello world`} />
```

This is a less common scenario, and we only recommend it if you have good reason. Because Astro is completely rendered at build-time, there are no client-side performance concerns to our default recommendation to export your components from a single `index.js` file.

To support importing by file within your package, add each file to your **package.json** `exports` map:

```diff
{
  "name": "@example/my-components",
  "version": "1.0.0",
  "exports": {
-    ".": "./index.js",
+    "./Bold.astro": "./Bold.astro",
+    "./Capitalize.astro": "./Capitalize.astro"
  }
}
```

## Community components

Looking for components already made by the community?

Here are the current available community developed Astro components.

- [Astro Static Tweet](https://www.npmjs.com/package/@rebelchris/astro-static-tweet) ~ A component to embed tweets as static HTML so you don't have to load the Twitter JavaScripts.

You can also [search npm for astro components.](https://www.npmjs.com/search?q=keywords%3Aastro-component)

Did you make a component?

[Create a PR to submit your component in these docs](https://github.com/snowpackjs/astro/issues/new/choose)
