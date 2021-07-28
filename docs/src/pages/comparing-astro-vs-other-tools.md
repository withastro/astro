---
layout: ~/layouts/Main.astro
title: Comparing Astro
---

We often get asked the question;
> "How does Astro compare to my favourite site builder, **\_\_\_\_**?"

To help answer this question we have written the following as a guide, where we compare Astro to several popular site builders and alternatives.

Don't worry if you don't see your favourite site builder listed here, [you're always welcome to discuss it with us via our Discord Server.](https://astro.build/chat)

## Astro

⚠️Project Status : **Astro is still in Beta.**

As a result, many of the tools listed here are more mature and well established. Some predate Astro by over 12+ years!

Given our current position, there are few features still missing from Astro with several APIs not yet finalized.

However, Astro is considered stable from a bug perspective and several production websites have already been built using Astro.

This is an important point to consider when choosing Astro.

## Docusaurus vs. Astro

[Docusaurus](https://docusaurus.io/) is a popular documentation website builder. Where it leverages the power of React for generating your site's UI and Markdown for your content.

Astro is similar in this respects, whereby we allow you to also write your content in Markdown. However, we do extend the scope of UI frameworks for you to use.

From being _only_ React as with Docusaurus, to encompassing other popular frameworks as well including; Vue, Svelte, etc. Even allowing for raw HTML templating.

Docusaurus was designed to build documentation websites and has some well formed documentation-specific features that are native to its system. Features that Astro does not yet have in its arsenal.

Instead, Astro offers documentation-specific features through an official [Docs Template](https://github.com/snowpackjs/astro/tree/main/examples/docs) that you can use to build your own documentation site. For instance this very website was built using our own documentation template!

### Comparing Performance

In the majority of use cases. Astro websites will load significantly faster than Docusaurus websites.

This is because Astro automatically strips all unnecessary JavaScript from the page, hydrating only the individual components as they need it. We refer to this process as ['Partial Hydration'](/core-concepts/component-hydration).

Docusaurus doesn't support partial hydration, instead has the user load and rehydrate the entire page inside the browser. Even if most of the page content is static.

This in-turn creates a slower page load which negatively impacts on the overall performance of your website. Unfortunately, there is no way to disable this behaviour in Docusaurus.

### Case Study

#### Building a Documentation Website

[docusaurus.io/docs](https://docusaurus.io/docs) is the official Docusaurus documentation website, built with Docusaurus. The website offers a similar enough design and feature-set to compare against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders.

- **Docusaurus performance score**: 26 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocusaurus.io%2Fdocs)
- **Astro performance score**: 95 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro's smaller JavaScript payload: [docusaurus.io/docs](https://docusaurus.io/docs) loads **238kb** of JavaScript on first load while [docs.astro.build](https://docs.astro.build) only loads **9.3kb** (96% less JavaScript, overall).

## Eleventy vs. Astro

[Eleventy](https://www.11ty.dev/) was designed to be a JavaScript alternative to Jekyll. As a result it has became a very popular static site builder, powered by Node.js.

Eleventy uses several older [HTML templating languages](https://en.wikipedia.org/wiki/Comparison_of_web_template_engines) such as:

- [Nunjucks](https://mozilla.github.io/nunjucks/)
- [Liquid](https://liquidjs.com/)
- [Pug](https://pugjs.org/api/getting-started.html)
- [EJS](https://ejs.co/),
And a [variety of other template languages](https://www.11ty.dev/docs/languages/) to render your website. Eleventy is also not a JavaScript Framework.

Astro, in comparison lets you create pages using a combination of your favourite UI component libraries (React, Preact, Vue, Svelte, and others) or by using our built-in component syntax that is similar to HTML &  JSX.

Whereas Eleventy does not support modern UI components nor does it allow for HTML templating using newer standards.

### Comparing Performance

Conceptually, Eleventy is aligned with Astro's "minimal client-side JavaScript" ethos towards web development. Eleventy and Astro both offer similar, zero-JavaScript-by-default performance baselines.

Eleventy achieves this by pushing you to avoid JavaScript entirely. Eleventy sites are often written with little to no JavaScript at all.

This becomes an issue when you do need client-side JavaScript. It is up to you to create your own asset build pipeline for Eleventy. This can be time consuming, forcing you to set up bundling, minification, and other complex optimizations by yourself.

By contrast, Astro automatically builds all of your client-side JavaScript & CSS for you.

Astro automatically strips unnecessary JavaScript from the page, [partially hydrating](/core-concepts/component-hydration) only the individual components that need it. While it is possible to achieve this yourself within Eleventy, Astro offers it by default.

When we compare the development pathways between Astro and Eleventy, it is clear that Astro immediately offers the developer a significant reduction on both additional complexity and time spent configuring their projects.

<!--
## Gatsby vs. Astro

**Next.js** is a popular website & application framework for React.


## Hexo vs. Astro

**Hexo** is a popular static site generator, powered by Node.js.

-->

## Hugo vs. Astro

[Hugo](https://gohugo.io/) is a very popular static site generator. Their popularity within the open-source community comes from their speedy development environment which is powered entirely by [Go.](https://golang.org/)

Hugo uses a custom [templating language](https://gohugo.io/templates/introduction/) to render your website. It does not readily support the implementation of different UI frameworks, but could do so with some manual effort and time.

In comparison Astro's de facto ability to work with a combination of different UI frameworks, lets you create pages using whichever set of libraries  you wish.

Alternatively you can take advantage of Astro's built-in component syntax which is very similar to HTML & JSX. Conversely, Hugo does not support using modern UI components for HTML templating.

### Comparing Performance

Conceptually, Hugo and Astro's both have a shared vision of "minimal client-side JavaScript" to web development.

Hugo and Astro both offer similar, zero-JavaScript-by-default performance baselines, which is a some feat considering Hugo's popularity is predominately built on top of their speed.

Both Hugo and Astro offer built-in support for building, bundling and minifying JavaScript. Astro's unique process of [partial hydration](/core-concepts/component-hydration) automatically strips out unnecessary JavaScript from the page, hydrating only the individual components that need it. While it is possible to achieve this yourself in Hugo, Astro offers it built in by default.

## Jekyll vs. Astro

[Jekyll](https://jekyllrb.com/) is a popular static site generator, powered by Ruby.

Jekyll uses an older [templating language](https://jekyllrb.com/docs/liquid/) to render your website called [Liquid](https://shopify.github.io/liquid/).

Astro however, lets you create pages using whichever set of your favourite UI component libraries you assemble together.

Or by using Astro's built-in component syntax which is very similar and familiar to HTML & JSX. Whereas Jekyll does not support using modern UI components for HTML templating.

### Comparing Performance

Astro and Jekyll both provide a "minimal client-side JavaScript" approach to web development. As a result, both Astro and Jekyll both offer similar performance baselines.

Jekyll approach to achieving zero-JavaScript-by-default achieves this by pushing you to avoid JavaScript entirely. Jekyll sites are often written with little to no JavaScript at all, and instead actively promotes server-side HTML rendering.

This becomes an issue when you do need client-side JavaScript. It is up to you to create your own build pipeline for Jekyll. This can be time-consuming and forces you to set up bundling, minification, and other optimizations yourself.

By contrast, Astro automatically builds your client-side JavaScript for you. Astro only sends the bare minimum amount of JavaScript to the browser, minified, bundled and optimized for production. While it is possible to achieve this yourself in Jekyll, with Astro this is built in by default.

## SvelteKit vs. Astro

[SvelteKit](https://kit.svelte.dev/) is a popular website & application framework made for [Svelte.](https://svelte.dev/)

Since SvelteKit uses only Svelte to compile and render your website. Astro by comparison is a lot more flexible.

Astro lets you choose which sets of UI component libraries to use when building your website. This can range from React to Svelte or even use Astro's own component syntax which is similar to HTML & JSX to template out your websites.

SvelteKit supports both Static Site Generation (SSG) and Server-Side Rendering (SSR). Presently, Astro only supports Static Site Generation (SSG).

Both SvelteKit and Astro are excellent frameworks for building websites. What SvelteKit does best, is with highly dynamic websites like dashboards and inboxes. Whilst Astro does highly static websites such as content and eCommerce websites better.

### Comparing Performance

In most use cases, Astro sites will load faster than those built using SvelteKit. Simply because Astro automatically strips all the unnecessary JavaScript from the page, [partially hydrating](/core-concepts/component-hydration) only the individual components that need it.

SvelteKit has no support for partial hydration. Instead the user has to load and rehydrate the entire page in the browser, even if most of the page content is static.

This creates a slower page load and worse performance for your website. SvelteKit does offer support for [page-level static, zero-JavaScript pages.](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate) 

However, there is no planned support for hydrating individual components on the page. This leaves you with an all-or-nothing decision for interactivity on a page by page basis.

### Case Study

[kit.svelte.dev](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate) is the official SvelteKit documentation website, built with SvelteKit.

The website offers a similar enough design and feature set to be compared against the official Astro documentation website. This gives us a **_rough, real-world_** comparison between the two site builders.

One notable difference between the two sites being tested: SvelteKit's documentation is served as a single page while Astro's is broken up into multiple pages.

This larger content payload should have a slight but negative impact on performance, that is not related to the tool itself.

- **SvelteKit performance score**: 92 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fkit.svelte.dev%2Fdocs)
- **Astro performance score**: 95 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

## Next.js vs. Astro

[Next.js](https://nextjs.org/) is a very popular website & application framework built solely for React.

Next.js uses React to render out your entire website. Astro's ability to utilise a mixture of UI frameworks means you are not 'locked' into a particular development path.

This increase in flexibility lets you construct your pages using an increasing set of UI component libraries from a mix of React & Preact, to also have Svelte and Vue components on the same site.

Alternatively you could use Astro's own component syntax, a syntax which is very much akin to HTML & JSX. Coming from a React background this would be very similar to what you are currently used to.

Since both Astro and Next.js are frameworks used for building websites. Next.js best performs with highly dynamic websites like Single Page Applications and Image sites. Currently, Astro is better with with highly static websites like content and eCommerce websites.

Next.js supports both Static Site Generation (SSG) and Server-Side Rendering (SSR). As it currently stands, Astro only supports Static Site Generation (SSG).

### Comparing Performance

In most cases, Astro websites will load significantly faster than Next.js websites. This is due to Astro automatically stripping all unnecessary JavaScript from the page, hydrating only the individual components that need it. Using Astro's unique feature, called [partial hydration](/core-concepts/component-hydration).

Next.js does not support partial hydration. Instead the user has to load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and severely impacts the overall performance of the website.

Next.js has [experimental support](https://piccalil.li/blog/new-year-new-website/#heading-no-client-side-react-code) for fully-static, zero-JavaScript pages. However, there is no planned support for hydrating individual components on the page. This leaves you with an all-or-nothing decision for interactivity on each page.

Next.js has great built-in image optimizations, which could make Next.js a better choice for some image-heavy websites.

### Case Study

[nextjs.org/docs](https://nextjs.org/docs/getting-started) is the official Next.js documentation website, built with Next.js. Their website offers a similar enough design and feature set to compare itself too the official Astro documentation website. This'll gives us a **_rough, real-world_** comparison between the two site builders for this common use-case.

- **Next.js performance score**: 59 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnextjs.org%2Fdocs%2Fgetting-started)
- **Astro performance score**: 95 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro's smaller JavaScript payload: [nextjs.org/docs](https://nextjs.org/docs/getting-started) loads **463kb** of JavaScript on first load while [docs.astro.build](https://docs.astro.build) only loads **9.3kb** (98% less JavaScript!, overall!!).

## Nuxt vs. Astro

[Nuxt](https://nextjs.org/) is a popular website & application framework predominantly used by the Vue Component library. It is similar in spirit to Next.js.

Nuxt uses Vue to template and render out your website. Whereas Nuxt, and Next, are single UI frameworks, Astro's flexibility allows you to incorporate more than one UI library into your site. Astro's built-in component syntax is very similar to HTML & JSX, coming from a Vue background this would be very similar to what you are currently used to.

Both Nuxt and Astro are frameworks for building websites. Nuxt does best with highly dynamic websites (like dashboards and inboxes) while Astro does best with highly static websites (like content and eCommerce websites).

Nuxt supports both Static Site Generation (SSG) and Server-Side Rendering (SSR). Today, Astro only supports Static Site Generation (SSG).

### Comparing Performance

In most cases, Astro websites will load significantly faster than Nuxt websites. This is because Astro automatically strips unnecessary JavaScript from the page, hydrating only the individual components that need it. This feature is called [partial hydration](/core-concepts/component-hydration).

Nuxt doesn't support partial hydration, and instead has the user load and rehydrate the entire page in the browser, even if most of the page content is static. This creates a slower page load and worse performance for your website. There is no way to disable this behaviour in Nuxt.

Nuxt has great built-in image optimizations, which could make Nuxt a better choice for some image-heavy websites.

### Case Study

[nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) is the Nuxt's official documentation website, built using Nuxt.js.

Their website offers a similar enough design and feature-set to be compared against our official Astro documentation website. This should give us a **_rough, real-world_** comparison between the two site builders for this use-case.

- **Nuxt performance score**: 48 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnuxtjs.org%2Fdocs%2F2.x%2Fget-started%2Finstallation)
- **Astro performance score**: 95 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

A key reason behind this performance difference is Astro's astronomically smaller JavaScript payload: [nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) loads **469kb** of JavaScript on first load whereas [docs.astro.build](https://docs.astro.build) only loads **9.3kb** (98% less JavaScript, overall!!).

## VuePress vs. Astro

[VuePress](https://vuepress.vuejs.org/guide/) is yet another popular documentation site builder. VuePress uses Vue.js to generate your website UI compared to Astro's multi UI support and scope for raw HTML templating.

VuePress was originally designed to build documentation websites and has some built-in  documentation-specific features that Astro unfortunately at present does not.

Instead, Astro offers documentation-specific features through our official [Docs](https://github.com/snowpackjs/astro/tree/main/examples/docs) template that you can use for your own documentation site. This very website was built using that template!

### Comparing Performance

In most cases, Astro websites will load significantly faster than atypical VuePress website. This is predominately due to Astro automatically stripping out all the unnecessary JavaScript from each page. [Partially hydrating](/core-concepts/component-hydration) only the individual components that need it.

VuePress has no support partial hydration. Instead the user has to load and rehydrate the entire page in the browser, even if most of the page content is static. This would naturally cause slower page loads and and overall deficient performance for your website. Unfortunately There is no way presently to disable this behaviour inside VuePress.

### Case Study

[vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) is the official VuePress documentation website, built entirely as one expects with VuePress.

Their website offers a similar enough design and feature-set to be suitably compared against our official Astro documentation site. This should give us a **_rough, real-world_** comparison between the two site builders for this use-case.

- **Vuepress performance score**: 63 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fvuepress.vuejs.org%2Fguide%2F)
- **Astro performance score**: 95 out of 100 [(full audit)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

One big reason behind this performance difference is Astro's astronomically smaller JavaScript payload: [vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) loads **166kb** of JavaScript on first load while [docs.astro.build](https://docs.astro.build) only loads **9.3kb** (95% less JavaScript, overall).
