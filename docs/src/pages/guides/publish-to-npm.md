---
layout: ~/layouts/MainLayout.astro
title: Publish to NPM
description: Learn how to publish Astro components to NPM
---

Building a new Astro component? **Publish it to [npm!](https://npmjs.com/)**

Publishing a component is a great way to reuse work across your team, your company, or the entire world. Astro components can be published to and installed from npm, just like any other JavaScript package.

**Astro's ability to publish and reuse popular components is one of it's most powerful features!**

Even if you don't plan on publishing your components online, the patterns outlined below can help any developer design reusable components in isolation from their custom website or business logic.

Looking for inspiration? Check out some of [our favorite themes & components][/themes] from the Astro community. You can also [search npm](https://www.npmjs.com/search?q=keywords:astro-component) to see the entire public catalog.

## Creating a package

> Before diving in, it will help have a basic understanding of:
> 
> - [Node Modules](https://docs.npmjs.com/creating-node-js-modules)
> - [JSON Manifest (`package.json`)](https://docs.npmjs.com/creating-a-package-json-file)
> - [Workspaces](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#workspaces)

To create a new package, we recommend developing with **workspaces**. This will allow you to develop your component alongside a working copy of Astro.

```
my-project/
   ├─ demo/
      └─ ... for testing and demonstration
   ├─ package.json
   └─ packages/
      └─ my-component/
         ├─ index.js
         ├─ package.json
         └─ ... additional files used by the package
```

In this example, named `my-project`, we create a project with a single package, named `my-component`, and a `demo` directory for testing and demonstrating the component.

This is configured in the project root’s `package.json` file.

```json
{
  "name": "my-project",
  "workspaces": [
    "demo",
    "packages/*"
  ]
}
```

In this example, multiple packages can be developed together from the `packages` directory. These packages can also be referenced from `demo`, where you can install a working copy of Astro.

```shell
npm init astro demo --template minimal
```

Now let’s explore the files that will make up your individual package:

### `package.json`

The `package.json` in the package directory includes all of the information related to your package, including its description, dependencies, and any other package metadata.

```json
{
  "name": "my-component",
  "description": "... description",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./astro": "./MyAstroComponent.astro",
    "./react": "./MyReactComponent.jsx"
  },
  "files": [
    "index.js",
    "MyAstroComponent.astro",
    "MyReactComponent.jsx"
  ],
  "keywords": [
    "astro-component",
    "... etc",
    "... etc"
  ]
}
```

#### `package.json#description`

The short description of your component used to help others know what it does.

```json
{
  "description": "An Astro Element Generator",
}
```

#### `package.json#type`

The module format used by Node.js and Astro to interpret your `index.js` files.

```json
{
  "type": "module"
}
```

We recommend using `"type": "module"` so that your `index.js` can be used as an entrypoint with `import` and `export`.

#### `package.json#exports`

The entry points allowed by Astro to import your component or any of its [files](#packagejsonfiles).

```json
{
  "exports": {
    ".": "./index.js",
    "./astro": "./MyAstroComponent.astro",
    "./react": "./MyReactComponent.jsx"
  }
}
```

In this example, importing `my-component` would use `index.js`, while importing `my-component/astro` or `my-component/react` would use `MyAstroComponent.astro` or `MyReactComponent.jsx`.

#### `package.json#files`

```json
{
  "files": [
    "index.js",
    "MyAstroComponent.astro",
    "MyReactComponent.jsx"
  ]
}
```

#### `package.json#keywords`

An array of keywords relevant to your component that are used to help others [find your component on npm](https://www.npmjs.com/search?q=keywords:astro-component) and any other search catalogs.

We recommend adding the `astro-component` as a special keyword to maximize its discoverability in the Astro ecosystem.

```json
{
  "keywords": [
    "astro-component",
    "... etc",
    "... etc"
  ]
}
```

---

### `index.js`

The main **package entrypoint** used whenever your package is imported.

```js
export { default as MyAstroComponent } from './MyAstroComponent.astro';

export { default as MyReactComponent } from './MyReactComponent.jsx';
```

This allows you to package multiple components together into a single interface.

#### Example: Using Named Imports

```astro
---
import { MyAstroComponent } from 'my-component';
import { MyReactComponent } from 'my-component';
---
<MyAstroComponent />
<MyReactComponent />
```

#### Example: Using Namespace Imports

```astro
---
import * as Example from 'example-astro-component';
---
<Example.MyAstroComponent />
<Example.MyReactComponent />
```

#### Example: Using Individual Imports

```astro
---
import MyAstroComponent from 'example-astro-component/astro';
import MyReactComponent from 'example-astro-component/react';
---
<MyAstroComponent />
<MyReactComponent />
```

---

## Developing your package

Astro does not have a dedicated "package mode" for development. Instead, you should use a demo project to develop and test your package inside of your project. This can be a private website only used for development, or a public demo/documentation website for your package.

If you are extracting components from an existing project, you can even continue to use that project to develop your now-extracted components.

## Testing your component

Astro does not currently ship a test runner. This is something that we would like to tackle before our v1.0 release. _(If you are interested in helping out, [join us on Discord!](https://astro.build/chat))_

In the meantime, our current recommendation for testing is:

1. Add a test `fixtures` directory to your `demo/src/pages` directory.
2. Add a new page for every test that you'd like to run.
3. Each page should include some different component usage that you'd like to test.
4. Run `astro build` to build your fixtures, then compare the output of the `dist/__fixtures__/` directory to what you expected.

```bash
my-project/demo/src/pages/__fixtures__/
  ├─ test-name-01.astro
  ├─ test-name-02.astro
  └─ test-name-03.astro
```

## Publishing your component

Once you have your package ready, you can publish it to npm!

To publish a package to npm, use the `npm publish` command. If that fails, make sure that you've logged in via `npm login` and that your package.json is correct. If it succeeds, you're done!

Notice that there was no `build` step for Astro packages. Any file type that Astro supports can be published directly without a build step, because we know that Astro already supports them natively. This includes all files with extensions like `.astro`, `.ts`, `.jsx`, and `.css`.

If you need some other file type that isn't natively supported by Astro, you are welcome to add a build step to your package. This advanced exercise is left up to you.
