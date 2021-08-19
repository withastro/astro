---
layout: ../../layouts/content-with-cover.astro
title: 'Getting Started with Svelte'
description: 'Get started with this in-depth tutorial on how to build Svelte applications and websites with Snowpack'
date: 2020-12-01
sidebarTitle: Svelte
tags: communityGuide
cover: '/img/SvelteGuide.jpg'
img: '/img/SvelteGuide.jpg'
---

Snowpack is a great fit for [Svelte](https://svelte.dev/) projects of any size. It's easy to get started and can scale to projects containing thousands of components and pages without any impact on development speed. Unlike traditional Svelte application tooling, Snowpack saves you from getting bogged down with complex bundler setups and configuration files.

> Snowpack is … astonishingly fast, and has a beautiful development experience (hot module reloading, error overlays and so on), and we've been working closely with the Snowpack team on features like SSR[Server-side rendering]. The hot module reloading is particularly revelatory. - [Rich Harris, creator of Svelte](https://svelte.dev/blog/whats-the-deal-with-sveltekit)

This guide is a step by step from an empty directory to a fully configured Snowpack project, in the process teaching:

- How to set up your Snowpack development environment
- Adding your first Svelte component
- Importing images and other web assets
- Enabling Hot Module Replacement (HMR)
- Connecting your favorite tools

Prerequisites: Snowpack is a command-line tool installed from npm. This guide assumes a basic understanding of Node.js, npm, and how to run commands in the terminal. Knowledge of Svelte is not required: Snowpack is an excellent way to learn Svelte!

> 💡 Tip: a [Svelte/Snowpack](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/app-template-svelte) working example is available in our Create Snowpack App templates.

## Getting started

The easiest way to start a new Snowpack project is with [Create Snowpack App](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/cli), a tool for creating a new project based on our example templates. `@snowpack/app-template-minimal` is a Create Snowpack App template for a simple, bare-bones Snowpack project setup that the rest of this guide builds on.

Run the following command in your terminal to create a new directory called `svelte-snowpack` with the minimal template installed:

```bash
npx create-snowpack-app svelte-snowpack --template @snowpack/app-template-minimal
```

Head to the new `svelte-snowpack` directory and start Snowpack with the following two commands:

```bash
cd svelte-snowpack
npm run dev
```

You should see your new website up and running!

<div class="frame"><img src="/img/guides/react/minimalist-hello-world.png" alt="screenshot of project-template-minimal, which shows 'Hello world' in text on a white background." class="screenshot"/></div>

Now that you have a basic project up and running! The next step is to install Svelte. Run the following command in your project directory:

```bash
npm install svelte --save
```

> 💡 Tip: add the `--use-yarn` or `--use-pnpm` flag to use something other than npm

```bash
npm install @snowpack/plugin-svelte --save-dev
```

Snowpack [plugins](/plugins) are a way to extend Snowpack's capabilities without having to do custom configuration yourself. Install the `@snowpack/plugin-svelte` plugin so that Snowpack knows how built `.svelte` files into JavaScript and CSS files that run in the browser:

Once installed, you'll need to add the plugin to your Snowpack configuration file (`snowpack.config.js`) so that Snowpack knows to use it:

```diff
// snowpack.config.js

module.exports = {
  mount: {
    /* ... */
  },
  plugins: [
-    /* ... */
+    '@snowpack/plugin-svelte'
  ],
```

Restart your Snowpack dev server to run it with the new configuration. Exit the process (ctrl + c in most Windows/Linux/macOS) and start it again with `npm run dev`.

> 💡 Tip: Restart the Snowpack development server when you make configuration changes (changes to the `snowpack.config.js`).

Snowpack will recognize the new dependency (Svelte, or "svelte/internal") and print the following output as installs your dependencies for the frontend:

```bash
[snowpack] installing dependencies...
[snowpack] ✔ install complete! [0.45s]
[snowpack]
  ⦿ web_modules/                                size       gzip       brotli
    ├─ svelte-hmr/runtime/hot-api-esm.js        22.17 KB   7.42 KB    6.3 KB
    ├─ svelte-hmr/runtime/proxy-adapter-dom.js  5.17 KB    1.65 KB    1.38 KB
    └─ svelte/internal.js                       52.78 KB   13.24 KB   11.45 KB
```

## Create your first Svelte component

You now have your Snowpack environment set up to build `.svelte` files for the browser. Now it's time to create your first Svelte component file!

Create a file named `App.svelte` in your project directory with the following code:

```html
<!-- App.svelte -->
<script>
  /* component logic will go here */
</script>
<style>
  /* css will go here */
</style>
<div class="App">
  <header class="App-header">
    <a
      class="App-link"
      href="https://svelte.dev"
      target="_blank"
      rel="noopener noreferrer"
    >
      Learn Svelte
    </a>
  </header>
</div>
```

Now you can use the new `App.svelte` file in your `index.js`:

```diff
// index.js

/* Add JavaScript code here! */
-console.log('Hello World! You did it! Welcome to Snowpack :D');
+import App from "./App.svelte";

+let app = new App({
+  target: document.body,
+});

+export default app;
```

The page should now say "Learn Svelte". Congratulations! you now have your first Svelte component!

<div class="frame"><img src="/img/guides/svelte/svelte-component-snowpack.gif" alt="code and site side by side, site is a 'Learn Svelte' link on a white background. When the text is edit to add 'Hello world' and the file saves, the changes show up in the site immediately." class="screenshot"/></div>

## Customize your project layout

Snowpack is flexible enough to support whatever project layout that you prefer. In this guide, you'll learn how to use a popular project pattern from the Svelte community.

```
📁 src : your Svelte components and their assets (CSS, images)
    ↳ index.js
    ↳ App.svelte
📁 public : global assets like images, fonts, icons, and global CSS
    ↳ index.css
    ↳ index.html
```

Use your favorite visual editor to rearrange and rename, or run these commands in the terminal:

```bash
mkdir src
mkdir public
mv index.js src/index.js
mv App.svelte src/App.svelte
mv index.html public/index.html
mv index.css public/index.css
```

This means if you are running Snowpack right now, the site is now broken as the files are all in different places. Lets add a "mount" configuration to update your site to your new project layout.

The `mount` configuration changes where Snowpack scan for and builds files. Head back to the `snowpack.config.js` file you edited when you added `@snowpack/plugin-svelte`. Add this to the empty `mount` object:

```diff
// snowpack.config.js

  mount: {
-   /* ... */
+   // directory name: 'build directory'
+   public: '/',
+   src: '/dist',
  },
```

<img src="/img/guides/folder-structure.png" alt="Graphic shows the original and new folder structures side by side. Arrows indicate that the files are built to where the arrow points. The Original side shows a folder labeled ./ entire directory with an arrow pointing to a folder labeled  mysite.com/*. The New side shows a folder labeled ./src/* with an arrow pointing to a folder labeled mysite.com/_dist/*. Then a second folder labeled ./public/* with an arrow pointing to a folder labeled mysite.com/* " />

`mount` is part of the [Snowpack Configuration API](/reference/configuration). It allows you to customize the file structure of your project. The key is the name of the directory and the value is where you'd like them in the final build. With this new configuration, Snowpack builds files in the `public` directory - like `public/index.css` - into `index.css`. Likewise, it builds files in `src` like `src/index.js` into `/dist/index.js`, so change that path in your `index.html`:

```diff
<!-- public/index.html -->

  <body>
    <h1>Welcome to Snowpack!</h1>
-   <script type="module" src="/index.js"></script>
+   <script type="module" src="/dist/index.js"></script>
  </body>
```

You'll need to restart Snowpack (stop the process in terminal and then run `npm run dev` again) for configuration file changes. It should look exactly as it did before, but now using your brand new project folder layout

## Adding an animated Svelte Logo

In Svelte you can add CSS directly to your component. This step demonstrates this capability by adding an animated logo.

[Download `logo.svg`](https://github.com/snowpackjs/snowpack/blob/main/create-snowpack-app/app-template-svelte/public/logo.svg) to your `public` directory. Now you can add it to your `App.svelte`

```diff
<!-- src/App.svelte -->

  <header class="App-header">
+   <img src="/logo.svg" class="App-logo" alt="logo" />
    <a
      class="App-link"
      href="https://svelte.dev"
      target="_blank"
      rel="noopener noreferrer">
      Learn Svelte
    </a>
```

<div class="frame"><img src="/img/guides/svelte/svelte-logo-snowpack.jpg" alt="Side by side of code and site. The site now has a very large Svelte logo. The code shows the src/App.svelte file "  class="screenshot"/></div>

With Svelte, CSS can go directly in your `.svelte` component. Add this code to the top of `App.svelte` between the `<style>` tags:

```html
<!-- src/App.svelte -->

<style>
  .App-header {
    background-color: #f9f6f6;
    color: #333;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: calc(10px + 2vmin);
  }
  .App-logo {
    height: 36vmin;
    pointer-events: none;
    margin-bottom: 3rem;
    animation: App-logo-pulse infinite 1.6s ease-in-out alternate;
  }
  @keyframes App-logo-pulse {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.06);
    }
  }
</style>
```

<div class="frame"><img src="/img/guides/svelte/svelte-logo-style-snowpack.gif" alt="code and site side by side, when the css is added to the Svelte component, the background becomes a beige, the logo shrinks down, and the logo has a pulsing animation" class="screenshot"/></div>

## Adding a counter to your Svelte component

Snowpack is one of the only Svelte dev environments to support Fast Refresh by default. With Fast Refresh, as you make changes to `.svelte` files, Snowpack pushes live updates to the browser without losing your place or resetting component state. To see this for yourself, go ahead and add a simple timer to your App.svelte component.

Svelte components include component specific scripts in a `<script>` tag. Add the counter here in `App.svelte` between the `<script>` tags:

```html
<!-- src/App.svelte -->

<script>
  import { onMount } from 'svelte';
  let count = 0;
  onMount(() => {
    const interval = setInterval(() => count++, 1000);
    return () => {
      clearInterval(interval);
    };
  });
</script>
```

Then lower down in your component's body, add this code that displays the results of the timer.

```diff
<!-- src/App.svelte -->

<div class="App">
    <header class="App-header">
      <img src="/logo.svg" class="App-logo" alt="logo" />
+     <p>Page has been open for <code>{count}</code> seconds.</p>
      <a class="App-link" href="https://svelte.dev" target="_blank" rel="noopener noreferrer">
        Learn Svelte
      </a>
    </header>
</div>
```

Change some code on the page (like the "Learn Svelte" button). You'll see the timer does not reset.

<div class="frame"><img src="/img/guides/svelte/svelte-snowpack-counter-1.gif" alt="Showing code and site side by side, when the word 'Hello' is added to the .svelte page and the code is saved, the change shows up in the browser without the timer resetting (it keeps counting)" class="screenshot"/></div>

What about other, non-Svelte files like `src/index.js`? To re-render your Svelte application when other files change, add this code snippet to the bottom:

```diff
<!-- src/index.js-->

export default app;

+// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
+// Learn more: https://www.snowpack.dev/concepts/hot-module-replacement
+if (import.meta.hot) {
+  import.meta.hot.accept();
+  import.meta.hot.dispose(() => {
+    app.$destroy();
+  });
+}
```

## Going further

Great job! You're now ready to build the Svelte project of your dreams with Snowpack. Want to tweet your accomplishment to the world? Click the button below:

<a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-text="I just learned how to build a Svelte app with #Snowpack. Check out the tutorial:" data-show-count="false">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

At this point you have the basics and have a great starter for any Svelte project. The official [Snowpack Svelte](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/app-template-svelte) example has a few other tools you might find useful:

- [Prettier](https://prettier.io/)—a popular code formatter

- [Tests](/guides/testing)—Snowpack supports any popular JavaScript testing framework

- [`@snowpack/plugin-dotenv`](https://github.com/snowpackjs/snowpack/tree/main/plugins/plugin-dotenv)—Use `dotenv` in your Snowpack. This is useful for environment specific variables

We also recommend the official [Svelte](https://svelte.dev/tutorial/basics) tutorial, which teaches more about how Svelte works and how to build Svelte components.

If you'd like to use Typescript with Snowpack and Svelte, check out the [Snowpack Svelte Typescript](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/app-template-svelte-typescript) template.

If you have any questions, comments, or corrections, we'd love to hear from you in the Snowpack [discussion](https://github.com/snowpackjs/snowpack/discussions) forum or our [Snowpack Discord community](https://discord.gg/rS8SnRk).
