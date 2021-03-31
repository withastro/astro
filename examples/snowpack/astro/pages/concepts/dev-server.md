---
layout: ../../layouts/content.astro
title: The Dev Server
description: Snowpack's dev server is fast because it only rebuilds the files you change. Powered by ESM (ES modules).
---

![dev command output example](/img/snowpack-dev-startup-2.png)

`snowpack dev` - Snowpack's dev server is an instant dev environment for [unbundled development.](/concepts/how-snowpack-works) The dev server will build a file only when it's requested by the browser. That means that Snowpack can start up instantly (usually in **<50ms**) and scale to infinitely large projects without slowing down. In contrast, it's common to see 30+ second dev startup times when building large apps with a traditional bundler.

Snowpack supports JSX & TypeScript source code by default. You can extend your build even further with [custom plugins](/plugins) that connect Snowpack with your favorite build tools: TypeScript, Babel, Vue, Svelte, PostCSS, Sass... go wild!
