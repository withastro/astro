---
layout: ~/layouts/MainLayout.astro
title: Comparing Astro
---

We often get asked the question, "How does Astro compare to my favorite site builder, **\_\_\_\_**?" This guide was written to help answer that question for several popular site builders and Astro alternatives.

If you don't see your favorite site builder listed here, [ask us in Discord.](https://astro.build/chat)

## Project Status

A quick note on project maturity: **Astro is still in beta.** Many of the tools listed here are much more mature. Some predate Astro by over 12 years!

A few features are still missing from Astro, and several APIs are not yet finalized. However, the project is considered stable from a bug perspective and several production websites have already been built using Astro. This is an important point to consider when choosing Astro.

## Docusaurus vs. Astro

[Docusaurus](https://docusaurus.io/) is a popular documentation website builder. Docusaurus uses React to generate your website UI while Astro supports React, Vue.js, Svelte, and raw HTML templating.

Docusaurus was designed to build documentation websites and has some built-in, documentation-specific website features that Astro does not. Instead, Astro offers documentation-specific features through an official [`docs`](https://github.com/snowpackjs/astro/tree/main/examples/docs) theme that you can use for your site. This website was built using that template!

#### Comparing Docusaurus vs. Astro Performance

In most cases, Astro websites will load significantly faster than Docusaurus websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/core-concepts/component-hydration).

Docusaurus doesn't support partial hydration, and instead has the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. There is no way to disable this behavior in Docusaurus.

#### Case Study: Building a Documentation Website

[docusaurus.io/docs](https://docusaurus.io/docs) is the official Docusaurus documentation website, built with Docusaurus. The website offers a similar enough design and featureset to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders.

- **Docusaurus performance score**: 26 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocusaurus.io%2Fdocs)
- **Astro performance score**: 95 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro's smaller JavaScript payload: [docusaurus.io/docs](https://docusaurus.io/docs) loads **238kb** of JavaScript on first load while [docs.astro.build](https://docs.astro.build) only loads **9.3kb** (96% less JavaScript, overall).

## Eleventy vs. Astro

[Eleventy](https://www.11ty.dev/) is a popular static site builder, powered by Node.js.

Eleventy uses several [older HTML templating languages](https://www.11ty.dev/docs/languages/) to render your website: Nunjucks, Liquid, Pug, EJS, and others. Astro lets you create pages using your favorite UI component libraries (React, Preact, Vue, Svelte, and others) or a built-in component syntax that is similar to HTML/JSX. Eleventy does not support using modern UI components for HTML templating.

#### Comparing Eleventy vs. Astro Performance

Conceptually, Eleventy is aligned with Astro's "minimal client-side JavaScript" approach to web development. Eleventy and Astro both offer similar, zero-JavaScript-by-default performance baselines.

Eleventy achieves this by pushing you to avoid JavaScript entirely. Eleventy sites are often written with little to no JavaScript at all. This becomes an issue when you do need client-side JavaScript. It is up to you to create your own asset build pipeline for Eleventy. This can be time consuming and forces you to set up bundling, minification, and other complex optimizations yourself.

By contrast, Astro automatically builds your client-side JavaScript & CSS for you. Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/core-concepts/component-hydration). While it is possible to achieve this yourself in Eleventy, Astro offers it built in by default.

<!--
## Gatsby vs. Astro

**Next.js** is a popular website & application framework for React.


## Hexo vs. Astro

**Hexo** is a popular static site generator, powered by Node.js.

-->

## Hugo vs. Astro

[Hugo](https://gohugo.io/) is a popular static site generator, powered by Go.

Hugo uses a custom [templating language](https://gohugo.io/templates/introduction/) to render your website. Astro lets you create pages using your favorite UI component libraries (React, Preact, Vue, Svelte, and others) or a built-in component syntax that is similar to HTML/JSX. Hugo does not support using modern UI components for HTML templating.

#### Comparing Hugo vs. Astro Performance

Conceptually, Hugo is aligned with Astro's "minimal client-side JavaScript" approach to web development. Hugo and Astro both offer similar, zero-JavaScript-by-default performance baselines.

Both Hugo and Astro offer built-in support for building, bundling and minifying JavaScript. Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/core-concepts/component-hydration). While it is possible to achieve this yourself in Hugo, Astro offers it built in by default.

## Jekyll vs. Astro

[Jekyll](https://jekyllrb.com/) is a popular static site generator, powered by Ruby.

Jekyll uses an older [templating language](https://jekyllrb.com/docs/liquid/) to render your website called Liquid. Astro lets you create pages using your favorite UI component libraries (React, Preact, Vue, Svelte, and others) or a built-in component syntax that is similar to HTML/JSX. Jekyll does not support using modern UI components for HTML templating.

#### Comparing Jekyll vs. Astro Performance

Conceptually, Jekyll is aligned with Astro's "minimal client-side JavaScript" approach to web development. Jekyll and Astro both offer similar, zero-JavaScript-by-default performance baselines.

Jekyll achieves this by pushing you to avoid JavaScript entirely. Jekyll sites are often written with little to no JavaScript at all, and instead promote server-side HTML rendering. This becomes an issue when you do need client-side JavaScript. It is up to you to create your own build pipeline for Jekyll. This can be time-consuming and forces you to set up bundling, minification, and other optimizations yourself.

By contrast, Astro automatically builds your client-side JavaScript for you. Astro only sends the bare minimum amount of JavaScript to the browser, minified, bundled and optimized for production. While it is possible to achieve this yourself in Jekyll, with Astro this is built in by default.

## SvelteKit vs. Astro

[SvelteKit](https://kit.svelte.dev/) is a popular website & application framework for Svelte.

SvelteKit uses Svelte to render your website. Astro is more flexible: you can use any UI component libraries (React, Preact, Vue, Svelte, and others) or Astro's built-in component syntax that is similar to HTML/JSX.

Both SvelteKit and Astro are frameworks for building websites. SvelteKit does best with highly dynamic websites (like dashboards and inboxes) while Astro does best with highly static websites (like content and eCommerce websites).

SvelteKit supports both Static Site Generation (SSG) and Server-Side Rendering (SSR). Today, Astro only supports Static Site Generation (SSG).

#### Comparing SvelteKit vs. Astro Performance

In most cases, Astro websites will load faster than SvelteKit websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/core-concepts/component-hydration).

SvelteKit doesn't support partial hydration, and instead has the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. SvelteKit does offer support for [page-level static, zero-JavaScript pages](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate). However, there is no planned support for hydrating individual components on the page. This leaves you with an all-or-nothing decision for interactivity on each page.

#### Case Study: Building a Documentation Website

[kit.svelte.dev](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate) is the official SvelteKit documentation website, built with SvelteKit. The website offers a similar enough design and featureset to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders for this common use-case.

One notable difference between the two sites being tested: SvelteKit's documentation is served as a single page while Astro's is broken up into multiple pages. This larger content payload should have a slight negative impact on performance that is not related to the tool itself.

- **SvelteKit performance score**: 92 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fkit.svelte.dev%2Fdocs)
- **Astro performance score**: 95 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

SvelteKit performed comparably to Astro in this test.

## Next.js vs. Astro

[Next.js](https://nextjs.org/) is a popular website & application framework for React.

Next.js uses React to render your website. Astro is more flexible: you can use any UI component libraries (React, Preact, Vue, Svelte, and others) or Astro's built-in component syntax that is similar to HTML/JSX.

Both Next.js and Astro are frameworks for building websites. Next.js does best with highly dynamic websites (like dashboards and inboxes) while Astro does best with highly static websites (like content and eCommerce websites).

Next.js supports both Static Site Generation (SSG) and Server-Side Rendering (SSR). Today, Astro only supports Static Site Generation (SSG).

#### Comparing Next.js vs. Astro Performance

In most cases, Astro websites will load significantly faster than Next.js websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/core-concepts/component-hydration).

Next.js doesn't support partial hydration, and instead has the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. Next.js has [experimental support](https://piccalil.li/blog/new-year-new-website/#heading-no-client-side-react-code) for fully-static, zero-JavaScript pages. However, there is no planned support for hydrating individual components on the page. This leaves you with an all-or-nothing decision for interactivity on each page.

Next.js has great built-in image optimizations, which could make Next.js a better choice for some image-heavy websites.

#### Case Study: Building a Documentation Website

[nextjs.org/docs](https://nextjs.org/docs/getting-started) is the official Next.js documentation website, built with Next.js. The website offers a similar enough design and featureset to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders for this common use-case.

- **Next.js performance score**: 59 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnextjs.org%2Fdocs%2Fgetting-started)
- **Astro performance score**: 95 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro's smaller JavaScript payload: [nextjs.org/docs](https://nextjs.org/docs/getting-started) loads **463kb** of JavaScript on first load while [docs.astro.build](https://docs.astro.build) only loads **9.3kb** (98% less JavaScript, overall).

## Nuxt vs. Astro

[Nuxt](https://nuxtjs.org/) is a popular website & application framework for Vue. It is similar to Next.js.

Nuxt uses Vue to render your website. Astro is more flexible: you can use any UI component libraries (React, Preact, Vue, Svelte, and others) or Astro's built-in component syntax that is similar to HTML/JSX.

Both Nuxt and Astro are frameworks for building websites. Nuxt does best with highly dynamic websites (like dashboards and inboxes) while Astro does best with highly static websites (like content and eCommerce websites).

Nuxt supports both Static Site Generation (SSG) and Server-Side Rendering (SSR). Today, Astro only supports Static Site Generation (SSG).

#### Comparing Nuxt vs. Astro Performance

In most cases, Astro websites will load significantly faster than Nuxt websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/core-concepts/component-hydration).

Nuxt doesn't support partial hydration, and instead has the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. There is no way to disable this behavior in Nuxt.

Nuxt has great built-in image optimizations, which could make Nuxt a better choice for some image-heavy websites.

#### Case Study: Building a Documentation Website

[nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) is the official Nuxt documentation website, built with Nuxt. The website offers a similar enough design and featureset to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders for this common use-case.

- **Nuxt performance score**: 48 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnuxtjs.org%2Fdocs%2F2.x%2Fget-started%2Finstallation)
- **Astro performance score**: 95 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro's smaller JavaScript payload: [nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) loads **469kb** of JavaScript on first load while [docs.astro.build](https://docs.astro.build) only loads **9.3kb** (98% less JavaScript, overall).

## VuePress vs. Astro

[VuePress](https://vuepress.vuejs.org/guide/) is a popular documentation website builder. VuePress uses Vue.js to generate your website UI while Astro supports React, Vue.js, Svelte, and raw HTML templating.

VuePress was designed to build documentation websites and has some built-in, documentation-specific website features that Astro does not. Instead, Astro offers documentation-specific features through an official [`docs`](https://github.com/snowpackjs/astro/tree/main/examples/docs) theme that you can use for your site. This website was built using that template!

#### Comparing VuePress vs. Astro Performance

In most cases, Astro websites will load significantly faster than VuePress websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/core-concepts/component-hydration).

VuePress doesn't support partial hydration, and instead has the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. There is no way to disable this behavior in VuePress.

#### Case Study: Building a Documentation Website

[vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) is the official VuePress documentation website, built with VuePress. The website offers a similar enough design and featureset to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders for this common use-case.

- **Vuepress performance score**: 63 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fvuepress.vuejs.org%2Fguide%2F)
- **Astro performance score**: 95 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro's smaller JavaScript payload: [vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) loads **166kb** of JavaScript on first load while [docs.astro.build](https://docs.astro.build) only loads **9.3kb** (95% less JavaScript, overall).
