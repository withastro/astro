---
title: 'Astro 0.21 Preview: Vite + WASM = ⚡️'
description: 'Get a sneak preview of what is next for Astro, including our new Vite build engine and WASM-powered Go compiler.'
publishDate: 'October 6, 2021'
permalink: 'https://astro.build/blog/astro-021-preview'
lang: 'en'
heroImage: '/assets/blog/astro-021-preview/hero.png'
heroImageAlt: 'Spacecraft overlooking Earth'
socialImage: '/assets/blog/astro-021-preview/social.png'
---

Astro v0.21.0 will be our biggest release yet. At a high-level, it includes:

- [A new build engine, powered by Vite](#hello-vite)
- [A new WASM compiler, written in Go](#hello-wasm)
- [Brand new features, like Components-in-Markdown](#components-in-markdown)
- [A new system for HTML live-updating via HMR](#hmr-meet-html)

You can try out our latest release today [in the browser](https://gitpod.io#snapshot/5e7cf2f1-8108-4fa5-99d3-ed8de70d8c23) or by running `npm install astro@next--compiler` in a new project directory on your machine.

Astro is quickly becoming the production-ready framework for building faster, content-focused websites. To celebrate this milestone, here are some highlights and details on what you can expect in Astro v0.21.0 and beyond.

## Hello, Vite!

Astro 0.21 is getting an internal build engine upgrade, replacing Snowpack with [Vite](https://vitejs.dev) going forward.

We ran some early experiments with Vite and came away extremely impressed. Vite is well-maintained, well-documented, a bit faster, has great error messages, and has been building clear community buy-in across multiple frameworks. SSR handling can be a bit flakey, but the Vite team is aware of this and actively working on it.

So now, when Evan You tweets about [some great performance optimization](https://twitter.com/youyuxi/status/1440718351802646550) that they're making in Vite you can be certain that the same speed is coming to Astro as well. 

The reverse is also true: we can now contribute fixes and improvements back to the larger Vite community.  Now, when we fix an SSR bug in Astro (like [adding support for ESM-only npm packages](https://github.com/vitejs/vite/pull/5197)) we're also fixing it for every other Vite user, including [SvelteKit](https://kit.svelte.dev/docs#routing-endpoints).

There's one other huge benefit to choosing Vite: Rollup plugins. Starting in v0.21.0, you'll be able to connect the entire ecosystem of Rollup plugins to Astro. Enable new features like [image optimizations](https://github.com/JonasKruckenberg/imagetools/tree/main/packages/vite) and [icon loading](https://github.com/antfu/unplugin-icons) with just a few simple plugins. Magic!

This switch from Snowpack to Vite might come as a surprise to some: Both Drew and myself are maintainers on both projects. This was [a hard decision](https://dev.to/fredkschott/5-more-things-i-learned-building-snowpack-to-20-000-stars-5dc9) for us to make. But ultimately, after working with both tools I can confidently say that Vite will be a great choice for Astro's future.


## Hello, WASM!

Astro 0.21 features another huge low-level improvement: the brand new [@astrojs/compiler](https://github.com/withastro/astro-compiler-next). Astro's new compiler is written in Go and distributed as WASM. You can run it right in your browser, or on the server in Node.js and Deno. 

The new [@astrojs/compiler](https://github.com/withastro/astro-compiler-next) unlocks:

- **Flexibility:** Run the compiler anywhere with WASM.
- **Speed:** Build sites faster with Go's compiled-language performance.
- **Stability:** Writing our own compiler allowed us to fix some long-standing bugs.

You can play with the new compiler today right in your browser at https://astro.build/play. This REPL is just one example of what is now possible when you have a fast, runs-anywhere compiler. 

Shout out to [Nate Moore](https://twitter.com/n_moore) who did an incredible job with this project.


## Components in Markdown

Our most requested feature ***by far*** has been the ability to use components directly in Markdown. After months of work, we're excited to announce that this feature is finally coming to Astro.

Starting in v0.21.0, you can import components inside of your Markdown frontmatter via an optional `setup` script. Once imported, your components can be used anywhere on the page:

```astro
---
title: 'Astro 0.21 Early Preview'
setup: |
  import Logo from '../components/Logo.astro';
  import ReactCounter from '../components/Counter.jsx';
---

# Astro now supports components in Markdown!

<Logo />

- Back to markdown here. 
- Supports static Astro components.
- Supports dynamic React/Vue/Svelte components!

<ReactCounter start={0} client:load /> 
```

This new `setup` script was designed for maximum flexibility. We'll keep improving this API going forward with planned support for default components, default layouts, and markdown component overrides.


## HMR, meet HTML

Starting in v0.21.0, Astro will support full HMR for Astro components and pages. Change any `.astro` file in your codebase, and watch the dev server update the page without a full refresh and without losing any client state.

Astro has always supported powerful HMR updates for client-side JavaScript components like React, Preact, Svelte, Vue, and Solid.js. But adding this for Astro was a fun challenge because Astro components are just static HTML. Our "Zero JavaScript" approach meant that there was no "Astro runtime" to hook into for updates. We had to get creative.

Now, Astro's dev server sends HTML updates to the browser and then runs a small script to diff those updates against the current page. This creates a more granular, component-level HMR update that won't impact the rest of the page.


## Try it today

If you've read this far, we'd love your help trying out the latest release before launch. You can try out our latest release today [in the browser](https://gitpod.io#snapshot/5e7cf2f1-8108-4fa5-99d3-ed8de70d8c23) or by running `npm install astro@next--compiler` in a new project directory. You can follow our progress and leave feedback in the `next` PR on GitHub: https://github.com/withastro/astro/pull/1406

Leave feedback, report bugs, and get involved with Astro's development in our [Discord server](https://astro.build/chat). You can also [follow along](https://twitter.com/astrodotbuild) on Twitter.

Keep your eyes on the sky, 👩‍🚀 Astronaut!
