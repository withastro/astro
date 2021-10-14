---
layout: ~/layouts/MainLayout.astro
title: Publish to NPM
description: Learn how to publish Astro components to NPM
---

Building a new Astro component? **Publish it to [npm!][npm]**

Publishing a component is a great way to reuse work across your team, your company, or the entire world. Astro components can be published to and installed from npm, just like any other JavaScript package.

**Astro's ability to publish and reuse popular UI components is one of it's most powerful features!**

Even if you don't plan on publishing your components online, the patterns outlined below can help any developer design reusable UI components in isolation from their custom website or business logic.

> **Note - Experimental:** Published npm components are still marked as experimental and some features are not yet supported. Astro component styles are currently disabled inside of npm packages, and JSX components must be compiled to `.js` in the package.

## Featured packages

Looking for inspiration? Check out some of [our favorite themes & components][themes] from the Astro community. You can also [search npm][published-astro-components] to see the entire public catalog.

## Folder layout

Below is our recommended folder layout for package development. The example below shows a single package named `package-name` but you can add more folders to the `packages/` directory to develop multiple packages together in the same repo:

```bash
packages/
└─ package-name/
  ├─ package.json
  ├─ index.js
  ├─ Capitalize.astro
  └─ Bold.astro
public/
  # see "Developing your package" below.
src/
  # see "Developing your package" below.
```

Lets explore the different files that will make up your package:

### `package.json`

Your package `package.json` file is known as your **package manifest.** Every package published to npm has one. This includes important configuration such as name, description, dependencies, and other package metadata. To publish anything to npm, it helps to have [a basic understanding][creating-a-package.json] of this JSON manifest format.

#### Recommended: "keywords"

When publishing an Astro component, include the `astro-component` keyword in your package.json file. This makes it easier for people to [find your component on npm][published-astro-components] and other search catalogs.

```json
{
  "keywords": ["astro-component", ...]
}
```

#### Recommended: "exports"

We **strongly recommend** that you include an [exports entry][node-packages-api] in your `package.json`. This entry controls access to internal package files, and gives you more control over how users can import your package.

```json
{
  "exports": "./index.js"
}
```

### `index.js`

We **strongly recommend** that every Astro package include an `index.js` file known as the **package entrypoint**. This is the file defined in your package `"exports"` entry (see above) that gets loaded when a user imports your package by name. Using a JavaScript entrypoint file lets you package multiple Astro components together into a single interface:

```js
// Example package entrypoint: index.js
// This lets users do: `import {Capitalize} from 'package-name';`
export { default as Capitalize } from './Capitalize.astro';
export { default as Bold } from './Bold.astro';
// also supported: React, Svelte, Vue, etc.:
export { default as Italic } from './SomeReactComponent.jsx';
```

### What about individual file imports?

We **strongly recommend** that you use an `index.js` package entrypoint to avoid individual file imports:

```js
// ✅ Do this:
import { Bold, Capitalize } from 'package-name';

// ❌ Avoid this:
import Bold from 'package-name/Bold.astro';
import Capitalize from 'package-name/Capitalize.astro';
```

Astro is rendered at build-time, so there should be no performance impact for the user when you use a single `index.js` entrypoint file like this. For any components that do get loaded in the browser, you can trust that Astro's production bundler will optimize and remove any unused imports.

If you need to use individual file imports, be sure to add those files to your package manifest's `exports` entry:

```diff
{
  "name": "@example/my-package",
  "version": "1.0.0",
- "exports": "./index.js"
+ "exports": {
+    "./Bold.astro": "./Bold.astro",
+    "./Capitalize.astro": "./Capitalize.astro"
+ }
}
```

## Developing your package

Astro does not have a dedicated "package mode" for development. Instead, you should use a demo project to develop and test your package inside of the repo. This can be a private website only used for development, or a public demo/documentation website for your package.

If you are extracting components from an existing project, you can even continue to use that project to develop your now-extracted components.

For development, we **strongly recommend** that you setup a [**project workspace.**][node-packages-workspace] Workspaces are a feature supported by all package managers including npm (v7+), yarn, pnpm and others. A workspace will help you verify package.json configuration and also let you import your package by name:

```js
// ✅ With workspaces:
import { Bold, Capitalize } from 'package-name';

// ❌ Without workspaces:
import { Bold, Capitalize } from '../../../my-package-directory/index.js';
```

To turn your project into a workspace, create a `package.json` file at the top-most level of your repository (if one doesn't already exist) and add a `"workspaces"` entry that identifies your `packages/` directory as a collection of packages:

```diff
{
  "name": "my-workspace",
  "Description": "this is the package.json that sits at the top-level of your repo.",
+ "workspaces": ["./packages/*"]
}
```

Save this change, and re-run your package manager's "install" command to set up your new workspace. If everything went well, you can now import your workspace packages by name.

You can optionally choose to move your development website's `src/` and `public/` directories into a workspace directory of their own. This is optional, and only recommended if you are familiar with how workspaces work.

```diff
{
  "name": "my-workspace",
  "Description": "this is the package.json that sits at the top-level of your repo.",
  "workspaces": [
    "./packages/*",
+   "./demo"
  ]
}
```

## Testing your component

Astro does not currently ship a test runner. This is something that we would like to tackle before our v1.0 release. _(If you are interested in helping out, [join us on Discord!][astro-discord])_

In the meantime, our current recommendation for testing is:

1. Add a test "fixtures" directory to your `src/pages` directory.
2. Add a new page for every test that you'd like to run.
3. Each page should include some different component usage that you'd like to test.
4. Run `astro build` to build your fixtures, then compare the output of the `dist/__fixtures__/` directory to what you expected.

```bash
src/pages/__fixtures__/
  ├─ test-name-01.astro
  ├─ test-name-02.astro
  └─ test-name-03.astro
```

## Publishing your component

Once you have your package ready, you can publish it to npm!

To publish a package to npm, use the `npm publish` command. If that fails, make sure that you've logged in via `npm login` and that your package.json is correct. If it succeeds, you're done!

Notice that there was no `build` step for Astro packages. Any file type that Astro supports can be published directly without a build step, because we know that Astro already supports them natively. This includes all files with extensions like `.astro`, `.ts`, `.jsx`, and `.css`.

If you need some other file type that isn't natively supported by Astro, you are welcome to add a build step to your package. This advanced exercise is left up to you.

[themes]: /themes
[npm]: https://npmjs.com/
[accessible-astro-components]: https://www.npmjs.com/package/accessible-astro-components
[astro-static-tweet]: https://www.npmjs.com/package/@rebelchris/astro-static-tweet
[astro-seo]: https://github.com/jonasmerlin/astro-seo
[published-astro-components]: https://www.npmjs.com/search?q=keywords%3Aastro-component
[creating-a-package.json]: https://docs.npmjs.com/creating-a-package-json-file
[node-packages-api]: https://nodejs.org/api/packages.html
[node-packages-workspace]: https://docs.npmjs.com/cli/v7/configuring-npm/package-json#workspaces
[astro-discord]: https://astro.build/chat
