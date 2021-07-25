---
layout: ~/layouts/Main.astro
title: Installation
---

There are a few different ways to install Astro in a new project.

## Prerequisites

- **Node.js** - `v12.20.0`, `v14.13.1`, `v16.0.0`, or higher.
- **A text editor** - We recommend [VS Code](https://code.visualstudio.com/) with the [Astro extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode).
- **A terminal** - Astro is mainly accessed via the terminal's command-line.

## Create Astro

`npm init astro` is the easiest way to install Astro in a new project. Run this command in your terminal to start our `create-astro` install wizard to assist you with setting up a new project.
<!-- TODO: Link to the Project Starter Templates page once it is written up -->

```shell
# With NPM
npm init astro

# Yarn
yarn create astro
```

[`create-astro`](https://github.com/snowpackjs/astro/tree/main/packages/create-astro) wizard lets you choose from a set of starter templates or alternatively, you could import your own  Astro project directly from  Github

```bash
# npm 6.x
npm init astro my-astro-project --template starter

# npm 7+, extra double-dash is needed:
npm init astro my-astro-project -- --template starter

# yarn
yarn create astro my-astro-project --template starter

# Import Astro project from Github
npm init astro my-astro-project -- --template GITHUB_USER/REPO
```

After `create-astro` scaffolds out your project, you would need to install any of the projects dependencies. To do this, enter:

``` bash
npm install
```

### Start Astro

```bash
npm start
```

This starts Astro's development server on, `http://localhost:3000`

## Manual Install

### Set up your project

```bash
# Note: Replace my-astro-project with the name of your project.
mkdir my-astro-project
cd my-astro-project
```

Create an empty directory with the name of your project, and then navigate into it:

### Create `package.json`

```bash
# This command will create a basic package.json for you
npm init --yes
```

Astro is designed to work with the entirety of the npm package ecosystem. Which is managed by a project manifest at the root of your project known as `package.json` . If you're not familiar with the `package.json` file, we highly recommend you to have a quick read about it on [the npm documentation](https://docs.npmjs.com/creating-a-package-json-file).


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
+    "build": "astro build"
  },
}
```

The `start` command launches the Astro Dev Server on http://localhost:3000. Once your project is ready, the `build` command outputs your project to the `./dist` directory. You can read more about [deploying your Astro site](/guides/deploy) to your preferred hosting provider.

### Create your first page

Astro Open up your favourite text editor, and create a new file in your project:

1. Create a new file at `./src/pages/index.astro`
2. Copy-and-paste this entire file (including `---` dashes) into it.

```astro
---
// Code written in between the (---) code fence, 
// is ran solely on the Server!
console.log('See me in the Terminal')
---

<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>

<style lang='css||scss'>
  body{
    h1{
      color:orange;
    }
  }
</style>

<script>
 // JS code entered here is ran entirely on the Browser
 console.log('See me in the devTools')
</script>
```

You can create more pages in the `src/pages` directory, and Astro will use the filename to create new pages on your site. For example, you can create a new file at `src/pages/about.astro` (reusing the previous snippet) and Astro will generate a new page at the `/about` URL.

### Next Steps

Success! You're now ready to start developing! Jump over to our [Quickstart Guide](/quick-start#start-your-project) for a 30-second walkthrough on how to start & build your new Astro project!

📚 Learn more about Astro's project structure in our [Project Structure guide](/core-concepts/project-structure).  
📚 Learn more about Astro's component syntax in our [Astro Components guide](/core-concepts/astro-components).  
📚 Learn more about Astro's file-based routing in our [Routing guide](core-concepts/astro-pages).
