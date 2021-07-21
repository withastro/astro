---
title: Hello, Documentation!
layout: ../layouts/Main.astro
---

<img src="https://github.com/snowpackjs/astro/blob/main/assets/social/banner.png?raw=true" alt="Astro" width="638" height="320" >

## What is Astro?

**Astro** is a _fresh but familiar_ approach to building websites. Astro combines decades of proven performance best practices with the DX improvements of the component-oriented era.

With Astro, you can use your favorite JavaScript framework and automatically ship the bare-minimum amount of JavaScript—by default, it's none at all!

## Project Status

⚠️ **Astro is still an early beta, missing features and bugs are to be expected!** If you can stomach it, then Astro-built sites are production ready and several production websites built with Astro already exist in the wild. We will update this note once we get closer to a stable, v1.0 release.

## 🔧 Quick Start

> **Important**: Astro is built with [ESM modules](https://nodejs.org/api/esm.html) which are not supported in older version of Node.js. The minimum supported version is **14.16.1**.

```bash
# create your project
mkdir new-project-directory
cd new-project-directory
npm init astro

# install your dependencies
npm install

# start the dev server and open your browser
npm start
```

### 🚀 Build & Deployment

The default Astro project has the following `scripts` in the `/package.json` file:

```json
{
  "scripts": {
    "start": "astro dev",
    "build": "astro build"
  }
}
```

For local development, run:

```
npm start
```

To build for production, run the following command:

```
npm run build
```

To deploy your Astro site to production, upload the contents of `/dist` to your favorite static site host.
