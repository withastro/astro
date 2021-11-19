---
title: 'Astro 0.21'
author: 'fred'
description: 'Astro v0.21.0 is finally here!'
publishDate: 'November 19, 2021'
permalink: 'https://astro.build/blog/astro-021-release'
lang: 'en'
heroImage: '/assets/blog/astro-021-preview/hero.png'
heroImageAlt: 'Spacecraft overlooking Earth'
---

Astro v0.21.0 is finally here! This is by far our biggest release ever, including a ground-up rewrite of some major Astro internals. After months of development and public testing, we are so excited to get this new version of Astro into your hands, featuring:

- A new Astro compiler, **written in [Go](https://golang.org/)**
- A new build engine, **powered by [Vite](http://vitejs.dev/)**
- [Components in Markdown](https://docs.astro.build/migration/0.21.0#components-in-markdown) (like MDX, but without the JSX)
- Improved npm package support (also powered by Vite!)
- Improved errors, stack traces, HMR, and overall dev experience
- A grab-bag of other new features for you to explore

[Try Astro v0.21.0 today](https://astro.new) right in your browser. Or, run `npm install astro@latest` in any new or existing project directory to get started. [Read our v0.21 Early Preview](/blog/astro-021-preview) post for more details on what is included in this release.

Thank you to every contributor and early preview tester who made this release possible. Thank you to [Nate Moore](https://twitter.com/n_moore), [Matthew Philips](https://twitter.com/matthewcp), and [Drew Powers](https://twitter.com/drwpow) for your tireless work over the last few months getting v0.21 out the door.

**With these new long-term investments, Astro isn't going anywhere.** Next stop, v1.0!

## Migrate to v0.21

Very little has changed in the v0.21.0 API to make your migration as easy as possible. Check out the new [v0.21 migration guide](https://docs.astro.build/migration/0.21.0) for a full breakdown of meaningful changes.

Leave feedback, report bugs, and get involved with Astro's development in our [Discord server](https://astro.build/chat). You can also [follow along](https://twitter.com/astrodotbuild) with our community on Twitter.

## Why Rewrite? Why Now?

Most people don't know this, but the first version of the Astro compiler was originally forked from [Svelte](https://svelte.dev/docs#Compile_time). Forking an existing compiler let us get up and running quickly, but cost us some unneccesary complexity that only grew over time.

Big rewrites are rarely easy, and this one was no exception.

Ultimately, it came down to timing. The timing was right for us to make a big investment in Astro now and deprecate our original forked compiler in favor of something designed with Astro in mind. This new compiler (written in Go) and new Vite-powered build engine will form a stable foundation that will last this project for years to come.

*Thank you to Rich Harris and the entire Svelte team for building a great open source compiler that served Astro well in its early days.*