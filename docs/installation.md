---
layout: ~/layouts/Main.astro
title: Installation
---

There are a few different ways to install

## Prerequisites

- **Node.js** - `v12.20.0`, `v14.13.1`, `v16.0.0`, or higher.
- **A text editor** - We recommend [VS Code](https://code.visualstudio.com/) with the [Astro extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode).
- **A terminal** - Astro is mainly accessed by terminal command-line.

## Recommended Install

`npm init astro` is the easiest way to install Astro in a new project. Run this command in your terminal to start our `create-astro` install wizard to walk you through setting up a new project.

```bash
mkdir <project-name>
cd <project-name>
npm init astro
```

Follow the CLI instructions to install Astro with one of our official project starter templates. 

Once completed, jump over to our [Quickstart Guide](/docs/quick-start.md#start-your-project) for a 30-second walkthrough on how to start & build your new Astro project!

## Manual Install

### Set up your project

Create an empty directory with the name of your project, and then navigate into it:

```bash
mkdir <project-name>
cd <project-name>
# Note: Replace <project-name> with the name of your project.
```

Create a new `package.json` file for your project. Astro is designed to work with the npm ecosystem of packages, which is managed in a `package.json` project manifest. If you don't know what the `package.json` file is, we highly recommend you to have a quick read on [the npm documentation](https://docs.npmjs.com/creating-a-package-json-file).

```bash
# This command will create a basic package.json for you
npm init --yes
```

### Install Astro

If you've followed the instructions above, you should have a directory with a single `package.json` file inside of it. You can now install Astro in your project. 

We'll use `npm` in the examples below, but you could also use `yarn` or `pnpm` if you prefer an npm alternative. If you aren't familiar with `yarn` or `pnpm`, then we strongly recommend sticking with `npm`.

```bash
npm install astro
```

You can now replace the placeholder "scripts" section of your `package.json` file that `npm init` created for you with the following:

```diff
  "scripts": {
-    "test": "echo \"Error: no test specified\" && exit 1"
+    "start": "astro dev",
+    "build": "astro build",
  },
}
```

### Create your first page

Open up your favorite text editor, and create a new file in your project:

```astro
---
// 1. Create a new file at <project-directory>/src/pages/index.astro
// 2. Copy-and-paste this entire file (including `-` dashes) into it.
---
<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>
```

You can create more pages in the `src/pages` directory, and Astro will use the filename to create new pages on your site. For example, you can create a new file at `src/pages/about.astro` (reusing the previous snippet) and Astro will generate a new page at the `/about` URL.

### Next Steps

Success! You're now ready to start developing! Jump over to our [Quickstart Guide](/docs/quick-start.md#start-your-project) for a 30-second walkthrough on how to start & build your new Astro project!

📚 Learn more about Astro's project structure in our [Project Structure guide](/docs/core-concepts/project-structure.md).  
📚 Learn more about Astro's component syntax in our [Astro Components guide](/docs/core-concepts/astro-components.md).  
📚 Learn more about Astro's file-based routing in our [Routing guide](core-concepts/astro-pages).

