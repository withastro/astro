---
layout: ~/layouts/MainLayout.astro
title: Comparing Astro
description: Comparing Astro with other static site generators like Gatsby, Next.js, Nuxt, Hugo, Eleventy, and more.
---

We often get asked the question, "How does Astro compare to my favorite site builder, **\_\_\_\_**?" This guide was written to help answer that question for several popular site builders and Astro alternatives.

If you don't see your favorite site builder listed here, [ask us in Discord.](https://astro.build/chat)

## Project Status

A quick note on project maturity: **Astro is still in beta.** Many of the tools listed here are much more mature. Some predate Astro by over 12 years!

A few features are still missing from Astro, and several APIs are not yet finalized. However, the project is considered stable from a bug perspective and several production websites have already been built using Astro. This is an important point to consider when choosing Astro.

## Docusaurus vs. Astro

[Docusaurus](https://docusaurus.io/) is a popular documentation website builder. Docusaurus uses React to generate your website UI while Astro supports React, Vue.js, Svelte, and raw HTML templating.

Docusaurus was designed to build documentation websites and has some built-in, documentation-specific website features that Astro does not. Instead, Astro offers documentation-specific features through an official [`docs`](https://github.com/withastro/astro/tree/main/examples/docs) theme that you can use for your site. This website was built using that template!

### Comparing Docusaurus vs. Astro Performance

In most cases, Astro websites will load significantly faster than Docusaurus websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/en/core-concepts/component-hydration).

Docusaurus doesn't support partial hydration, and instead makes the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. There is no way to disable this behavior in Docusaurus.

### Case Study: Building a Documentation Website

[docusaurus.io/docs](https://docusaurus.io/docs) is the official Docusaurus documentation website, built with Docusaurus. The website offers a similar enough design and featureset to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders.

- **Docusaurus performance score**: 61 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocusaurus.io%2Fdocs)
- **Astro performance score**: 99 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro’s smaller JavaScript payload: [docusaurus.io/docs](https://docusaurus.io/docs) loads **238kb** of JavaScript on first page load while [docs.astro.build](https://docs.astro.build) loads **78.7kb** (67% less JavaScript, overall) _after_ first load.

## Elder.js vs. Astro

[Elder.js](https://elderguide.com/tech/elderjs/) is an opinionated static site builder built for Svelte.

Elder.js uses Svelte to render your website. Astro is more flexible: you are free to build UI with any popular component library (React, Preact, Vue, Svelte, Solid and others) or Astro’s HTML-like component syntax which is similar to HTML + JSX.

Elder.js is unique on this list as the only other site builder to support [partial hydration](/en/core-concepts/component-hydration). Both Astro and Elder.js automatically strip unnecessary JavaScript from the page, hydrating only the individual components that need it. Elder’s API for partial hydration is a bit different and Astro supports a few features that Elder.js doesn't (like `client:media`). However performance-wise, both projects will build very similar sites.

Elder.js uses a custom routing solution that may feel unfamiliar to new developers. Astro uses [file-based routing](/en/core-concepts/routing) which should feel familiar to anyone coming from Next.js, SvelteKit, and even other static site builders like Eleventy.

Elder.js was designed to run on large websites, and claims to build one website of ~20k pages in less than 10 minutes (on a modest VM). At the time of writing, Astro builds ~1k pages in 66 seconds but has not yet been tested on 20k+ page projects. Astro is still in early beta, and matching Elder.js build speed is a goal for Astro v1.0.

Elder.js supports both Static Site Generation (SSG) and Server-Side Rendering (SSR). Today, Astro only supports Static Site Generation (SSG).

## Eleventy vs. Astro

[Eleventy](https://www.11ty.dev/) is a popular static site builder, powered by Node.js.

Eleventy uses several [older HTML templating languages](https://www.11ty.dev/docs/languages/) to render your website: Nunjucks, Liquid, Pug, EJS, and others. Astro lets you create pages using your favorite UI component libraries (React, Preact, Vue, Svelte, and others) or a built-in component syntax which is similar to HTML + JSX. Eleventy does not support using modern UI components for HTML templating.

### Comparing Eleventy vs. Astro Performance

Conceptually, Eleventy is aligned with Astro’s "minimal client-side JavaScript" approach to web development. Eleventy and Astro both offer similar, zero-JavaScript-by-default performance baselines.

Eleventy achieves this by pushing you to avoid JavaScript entirely. Eleventy sites are often written with little to no JavaScript at all. This becomes an issue when you do need client-side JavaScript. It is up to you to create your own asset build pipeline for Eleventy. This can be time consuming and forces you to set up bundling, minification, and other complex optimizations yourself.

By contrast, Astro automatically builds your client-side JavaScript & CSS for you. Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/en/core-concepts/component-hydration). While it is possible to achieve this yourself in Eleventy, Astro offers it built in by default.

## Gatsby vs. Astro

[Gatsby](https://www.gatsbyjs.com/) is a popular website & application framework for React.

Gatsby uses React to render your website. Astro is more flexible: you are free to build UI with any popular component library (React, Preact, Vue, Svelte, Solid and others) or Astro’s HTML-like component syntax which is similar to HTML + JSX.

Gatsby v4 supports both Static Site Generation (SSG) with incremental rebuilds, Deferred Static Generation (DSG), and Server-Side Rendering (SSR). Today, Astro only supports Static Site Generation (SSG).

Gatsby requires a custom GraphQL API for working with all of your site content. While some developers enjoy this model, a common criticism of Gatsby is that this model becomes too complex and difficult to maintain over time, especially as sites grow. Astro has no GraphQL requirement, and instead provides familiar APIs (like `fetch()` and top-level `await`) for data loading close to where the data is needed.

### Comparing Gatsby vs. Astro Performance

In most cases, Astro websites will load significantly faster than Gatsby websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/en/core-concepts/component-hydration).

Gatsby doesn't support partial hydration, and instead makes the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. Gatsby has [a community plugin](https://www.gatsbyjs.com/plugins/gatsby-plugin-no-javascript/) for removing all JavaScript from the page, but this would break many websites. This leaves you with an all-or-nothing decision for interactivity on each page.

Gatsby has a great plugin ecosystem, which could make Gatsby a better choice for your project depending on your needs. [gatsby-plugin-image](https://www.gatsbyjs.com/plugins/gatsby-plugin-image/) is a popular plugin for image optimizations, which could make Gatsby a better choice for some image-heavy websites.

### Case Study: Building a Documentation Website

[gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/) is the official Gatsby documentation website, built with Gatsby. The website offers a similar enough design and feature-set to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders for this common use-case.

- **Gatsby performance score**: 64 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fwww.gatsbyjs.com%2Fdocs%2Fquick-start%2F)
- **Astro performance score**: 99 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro’s smaller JavaScript payload: [gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/) loads **417kb** of JavaScript on first page load while [docs.astro.build](https://docs.astro.build) loads **78.7kb** (81% less JavaScript, overall) _after_ first load.

## Hugo vs. Astro

[Hugo](https://gohugo.io/) is a popular static site generator, powered by Go.

Hugo uses a custom [templating language](https://gohugo.io/templates/introduction/) to render your website. Astro lets you create pages using your favorite UI component libraries (React, Preact, Vue, Svelte, and others) or a built-in component syntax which is similar to HTML + JSX. Hugo does not support using modern UI components for HTML templating.

### Comparing Hugo vs. Astro Performance

Conceptually, Hugo is aligned with Astro’s "minimal client-side JavaScript" approach to web development. Hugo and Astro both offer similar, zero-JavaScript-by-default performance baselines.

Both Hugo and Astro offer built-in support for building, bundling and minifying JavaScript. Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/en/core-concepts/component-hydration). While it is possible to achieve this yourself in Hugo, Astro offers it built in by default.

## Jekyll vs. Astro

[Jekyll](https://jekyllrb.com/) is a popular static site generator, powered by Ruby.

Jekyll uses an older [templating language](https://jekyllrb.com/docs/liquid/) to render your website called Liquid. Astro lets you create pages using your favorite UI component libraries (React, Preact, Vue, Svelte, and others) or a built-in component syntax which is similar to HTML + JSX. Jekyll does not support using modern UI components for HTML templating.

### Comparing Jekyll vs. Astro Performance

Conceptually, Jekyll is aligned with Astro’s "minimal client-side JavaScript" approach to web development. Jekyll and Astro both offer similar, zero-JavaScript-by-default performance baselines.

Jekyll achieves this by pushing you to avoid JavaScript entirely. Jekyll sites are often written with little to no JavaScript at all, and instead promote server-side HTML rendering. This becomes an issue when you do need client-side JavaScript. It is up to you to create your own build pipeline for Jekyll. This can be time-consuming and forces you to set up bundling, minification, and other optimizations yourself.

By contrast, Astro automatically builds your client-side JavaScript for you. Astro only sends the bare minimum amount of JavaScript to the browser, minified, bundled and optimized for production. While it is possible to achieve this yourself in Jekyll, with Astro this is built in by default.

## SvelteKit vs. Astro

[SvelteKit](https://kit.svelte.dev/) is a popular website & application framework for Svelte.

SvelteKit uses Svelte to render your website. Astro is more flexible: you are free to build UI with any popular component library (React, Preact, Vue, Svelte, Solid and others) or Astro’s HTML-like component syntax which is similar to HTML + JSX.

Both SvelteKit and Astro are frameworks for building websites. SvelteKit does best with highly dynamic websites (like dashboards and inboxes) while Astro does best with highly static websites (like content and eCommerce websites).

SvelteKit supports both Static Site Generation (SSG) and Server-Side Rendering (SSR). Today, Astro only supports Static Site Generation (SSG).

### Comparing SvelteKit vs. Astro Performance

In most cases, Astro websites will load faster than SvelteKit websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/en/core-concepts/component-hydration).

SvelteKit doesn't support partial hydration, and instead makes the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. SvelteKit does offer support for [page-level static, zero-JavaScript pages](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate). However, there is no planned support for hydrating individual components on the page. This leaves you with an all-or-nothing decision for interactivity on each page.

### Case Study: Building a Documentation Website

[kit.svelte.dev](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate) is the official SvelteKit documentation website, built with SvelteKit. The website offers a similar enough design and featureset to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders for this common use-case.

One notable difference between the two sites being tested: SvelteKit’s documentation is served as a single page while Astro’s is broken up into multiple pages. This larger content payload should have a slight negative impact on performance that is not related to the tool itself.

- **SvelteKit performance score**: 92 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fkit.svelte.dev%2Fdocs)
- **Astro performance score**: 99 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

SvelteKit performed comparably to Astro in this test.

## Next.js vs. Astro

[Next.js](https://nextjs.org/) is a popular website & application framework for React.

Next.js uses React to render your website. Astro is more flexible: you are free to build UI with any popular component library (React, Preact, Vue, Svelte, Solid and others) or Astro’s HTML-like component syntax which is similar to HTML + JSX.

Both Next.js and Astro are frameworks for building websites. Next.js does best with highly dynamic websites (like dashboards and inboxes) while Astro does best with highly static websites (like content and eCommerce websites).

Next.js supports both Static Site Generation (SSG) and Server-Side Rendering (SSR). Today, Astro only supports Static Site Generation (SSG).

### Comparing Next.js vs. Astro Performance

In most cases, Astro websites will load significantly faster than Next.js websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/en/core-concepts/component-hydration).

Next.js doesn't support partial hydration, and instead makes the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. Next.js has [experimental support](https://piccalil.li/blog/new-year-new-website/#heading-no-client-side-react-code) for fully-static, zero-JavaScript pages. However, there is no planned support for hydrating individual components on the page. This leaves you with an all-or-nothing decision for interactivity on each page.

Next.js has great built-in image optimizations, which could make Next.js a better choice for some image-heavy websites.

### Case Study: Building a Documentation Website

[nextjs.org/docs](https://nextjs.org/docs/getting-started) is the official Next.js documentation website, built with Next.js. The website offers a similar enough design and featureset to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders for this common use-case.

- **Next.js performance score**: 59 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnextjs.org%2Fdocs%2Fgetting-started)
- **Astro performance score**: 99 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro’s smaller JavaScript payload: [nextjs.org/docs](https://nextjs.org/docs/getting-started) loads **463kb** of JavaScript on first page load while [docs.astro.build](https://docs.astro.build) loads **78.7kb** (83% less JavaScript, overall) _after_ first load.

## Nuxt vs. Astro

[Nuxt](https://nuxtjs.org/) is a popular website & application framework for Vue. It is similar to Next.js.

Nuxt uses Vue to render your website. Astro is more flexible: you are free to build UI with any popular component library (React, Preact, Vue, Svelte, Solid and others) or Astro’s HTML-like component syntax which is similar to HTML + JSX.

Both Nuxt and Astro are frameworks for building websites. Nuxt does best with highly dynamic websites (like dashboards and inboxes) while Astro does best with highly static websites (like content and eCommerce websites).

Nuxt supports both Static Site Generation (SSG) and Server-Side Rendering (SSR). Today, Astro only supports Static Site Generation (SSG).

### Comparing Nuxt vs. Astro Performance

In most cases, Astro websites will load significantly faster than Nuxt websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/en/core-concepts/component-hydration).

Nuxt doesn't support partial hydration, and instead makes the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. There is no way to disable this behavior in Nuxt.

Nuxt has great built-in image optimizations, which could make Nuxt a better choice for some image-heavy websites.

### Case Study: Building a Documentation Website

[nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) is the official Nuxt documentation website, built with Nuxt. The website offers a similar enough design and featureset to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders for this common use-case.

- **Nuxt performance score**: 48 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnuxtjs.org%2Fdocs%2F2.x%2Fget-started%2Finstallation)
- **Astro performance score**: 99 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro’s smaller JavaScript payload: [nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) loads **469kb** of JavaScript on first page load while [docs.astro.build](https://docs.astro.build) loads **78.7kb** (83% less JavaScript), _after_ first load.

## VuePress vs. Astro

[VuePress](https://vuepress.vuejs.org/guide/) is a popular documentation website builder from the creators of Vue.js. VuePress uses Vue.js to generate your website UI while Astro supports React, Vue.js, Svelte, and raw HTML templating.

VuePress was designed for documentation websites and has some built-in, documentation-specific website features that Astro does not support out of the box. Instead, Astro offers documentation-specific features through an official [`docs`](https://github.com/withastro/astro/tree/main/examples/docs) theme that you can use for your site. This website was built using that template!

Evan You (creator of Vue.js) is currently working on a new version of Vuepress called [VitePress.](https://vitepress.vuejs.org/). If you want a modern alternative to VuePress, [check out Evan’s post](https://github.com/withastro/astro/issues/1159#issue-974035962) on why VitePress may be a better option.

### Comparing VuePress vs. Astro Performance

In most cases, Astro websites will load significantly faster than VuePress websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/en/core-concepts/component-hydration).

VuePress doesn't support partial hydration, and instead makes the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. There is no way to disable this behavior in VuePress.

### Case Study: Building a Documentation Website

[vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) is the official VuePress documentation website, built with VuePress. The website offers a similar enough design and featureset to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders for this common use-case.

- **Vuepress performance score**: 63 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fvuepress.vuejs.org%2Fguide%2F)
- **Astro performance score**: 99 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro’s smaller JavaScript payload: [vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) loads **166kb** of JavaScript on first page load while [docs.astro.build](https://docs.astro.build) loads **78.7kb** (53% less JavaScript, overall) _after_ first load.

## Zola vs. Astro

[Zola](https://www.getzola.org/) is a popular and fast static site generator, powered by Rust.

Zola uses [Tera](https://tera.netlify.app/) to render your website. Astro lets you create pages using your favorite UI component libraries (React, Preact, Vue, Svelte, and others) or a built-in component syntax which is similar to HTML + JSX. Zola does not support using modern UI components for HTML templating.

### Comparing Zola vs. Astro Performance

Conceptually, Zola is aligned with Astro’s "minimal client-side JavaScript" approach to web development. Zola and Astro both offer similar, zero-JavaScript-by-default performance baselines.

Astro offer built-in support for building, bundling and minifying JavaScript. Zola requires using another build tool like Webpack to bundle and process JavaScript. Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/en/core-concepts/component-hydration). While it is possible to achieve this yourself in Zola, Astro offers it built in by default.
