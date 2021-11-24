---
layout: ~/layouts/MainLayout.astro
title: Astro 对比其他框架
lang: zh-CN
---

我们经常被问到这个问题, "Astro 和我最喜欢的网站构建工具**\_\_\_\_**相比如何？"本指南是为了帮助回答这个问题而编写的，适用于几个流行的网站构建工具以及 Astro 替代品。

如果你没有看到你最喜欢的网站构建工具被列在这里。 [请在 Discord 告诉我们](https://astro.build/chat)

## 项目现状

关于项目成熟度的简短说明。**Astro 仍处于测试阶段** 这里列出的许多工具都要比 Astro 成熟得多。有些工具比 Astro 早了 12 年以上。

Astro 仍然缺少一些功能，一些 API 还没有最终确定。虽然项目暂时并不稳定，但是已经有几个生产型网站使用 Astro 建立。这是选择 Astro 时需要考虑的一个重要问题。

## Docusaurus vs. Astro

[Docusaurus](https://docusaurus.io/) 是一个流行的文档网站创建工具。Docusaurus 使用 React 来生成你的网站界面，而 Astro 支持 React、 Vue.js 、Svelte 以及原始 HTML 模板。

Docusaurus 是为建立文档网站而设计的，它有一些内置的、针对文档的网站功能，而 Astro 却没有。相反，Astro 通过一个官方的 [`docs`](https://github.com/withastro/astro/tree/main/examples/docs) 主题提供了特定的文档功能，你可以在你的网站尝试使用。本网站就是用这个模板建立的!

#### 对比 Docusaurus 及 Astro 性能

在大多数情况下，Astro 网站的加载速度将明显快于 Docusaurus 网站。这是因为 Astro 会自动从页面中剥离不必要的 JavaScript，只对需要它的个别组件进行渲染。这个功能被称为[局部渲染](/core-concepts/component-hydration)。

Docusaurus 不支持局部渲染，而是让用户在浏览器中加载并重新渲染整个页面，即使大部分的页面内容是静态的。这为你的网站创造了一个较慢的页面加载和较差的性能。在 Docusaurus 中没有办法停用这种行为。

#### 案例研究 : 构建文档网站

[Docusaurus. io/docs](https://docusaurus.io/docs) 是官方的 Docusaurus 文档网站，由 Docusaurus 构建。该网站提供了大量设计模板和功能插件，可以与官方 Astro 文档网站进行比较。让我们对这两个网站构建工具进行一个粗略的真实的比较。

- **Docusaurus 性能评分**:26 / 100[(更多详情)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocusaurus.io%2Fdocs)
- **Astro 性能分数**:95(满分 100)[(更多详情)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

性能差异背后的一个主要原因是 Astro 的 JavaScript 依赖更小:[docusaurus.io/docs](https://docusaurus.io/docs)在第一次加载时加载**238kb**的 JavaScript，而[docs.astro.build](https://docs.astro.build)第一次只加载**9.3kb**(总体上减少 96%的 JavaScript)。

## Eleventy vs. Astro

[Eleventy](https://www.11ty.dev/)是一个流行的静态网站构建器，由 Node.js 提供支持。

Eleventy 使用了几种[较老的 HTML 模板语言](https://www.11ty.dev/docs/languages/)来渲染你的网站:Nunjucks, Liquid, Pug, EJS 等等。Astro 允许您使用您喜欢的 UI 组件库(React、Preact、Vue、Svelte 等)或类似于 HTML/JSX 的内置组件语法创建页面。eleven 不支持在 HTML 模板中使用现代 UI 组件。

#### 对比 Eleventy 及 Astro 性能

从概念上讲，Eleventy 与 Astro 的 "最小客户端 JavaScript "的网络开发方法是一致的。Eleventy 和 Astro 都提供类似的零 JavaScript 默认性能基线。

Eleventy 通过推动你完全避免使用 JavaScript 来实现这一目标。Eleventy 的网站通常很少或根本没有使用 JavaScript。当你确实需要客户端的 JavaScript 时，这就成了一个问题。你可以为 Eleventy 创建自己的资产构建管道。这可能会很耗时，并迫使你自己设置捆绑、最小化和其他复杂的优化。

相比之下，Astro 自动为你构建客户端的 JavaScript 和 CSS。Astro 自动从页面中剥离不必要的 JavaScript，只对需要它的个别组件进行渲染。这个功能被称为[局部渲染](/core-concepts/component-hydration)。虽然在 Eleventy 中可以自己实现这个功能，但 Astro 默认提供了内置的功能。

## Gatsby vs. Astro

[Gatsby](https://www.gatsbyjs.com/)是一个流行的 React 的网站和应用程序框架。

Gatsby 使用 React 来渲染你的网站。Astro 更灵活：你可以自由地使用任何流行的组件库（React、Preact、Vue、Svelte、Solid 和其他）或 Astro 的类似 HTML 的组件语法来构建 UI，这类似于 HTML+JSX 。

今天，Gatsby 和 Astro 都只支持静态网站生成（SSG）。Gatsby 支持增量重建，而 Astro 只支持完整的网站重建。Astro 已经表示计划在未来的版本中支持服务器端渲染（SSR），而 Gatsby 没有计划支持 SSR。

Gatsby 需要一个定制的 GraphQL API 来处理所有的网站内容。虽然有些开发者喜欢这种模式，但对 Gatsby 的一个普遍意见是，这种模式随着时间的推移变得过于复杂和难以维护，特别是随着网站的增长。Astro 没有 GraphQL 要求，而是提供熟悉的 API（如`fetch()`和顶层的`await`），以便在需要数据的地方加载数据。

#### 对比 Gastby 及 Astro 性能

在大多数情况下，Astro 网站的加载速度将明显快于 Gatsby 网站。这是因为 Astro 会自动从页面中剥离不必要的 JavaScript，只对需要它的个别组件进行渲染。这个功能被称为[局部渲染](/core-concepts/component-hydration)。

Gatsby 不支持局部渲染，而是让用户在浏览器中加载并重新渲染整个页面，即使大部分页面内容是静态的。这为你的网站创造了更慢的页面加载和更差的性能。Gatsby 有[一个社区插件](https://www.gatsbyjs.com/plugins/gatsby-plugin-no-javascript/)用于移除页面中的所有 JavaScript 但这将破坏许多网站。这让你在每个页面的互动性上做出一个全有或全无的决定。

Gatsby 有一个很好的插件生态系统，根据你的需要，它可以使 Gatsby 成为你的项目的更好选择。[gatsby-plugin-image](https://www.gatsbyjs.com/plugins/gatsby-plugin-image/)是一个流行的图像优化插件，这可能使 Gatsby 成为一些图像密集型网站的更好选择。

#### 案例研究 : 构建文档网站

[gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/)是 Gatsby 的官方文档网站，用 Gatsby 构建。该网站提供了足够相似的设计和功能集，可以与 Astro 官方文档网站进行比较。让我们对这两个网站构建工具进行一个粗略的真实的比较。以满足这个常见的使用情况。

- **Gatsby 性能评分**: 64 分（满分 100 分）[(更多详情)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fwww.gatsbyjs.com%2Fdocs%2Fquick-start%2F)
- **Astro 性能评分**: 99 分（满分 100 分）[(更多详情)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

这种性能差异背后的一个重要原因是 Astro 的 JavaScript 有效载荷较小。[gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/)在首次加载页面时加载了**417kb**的 JavaScript，而[docs.astro.build](https://docs.astro.build)在首次加载后加载了**78.7kb**（总体上减少了 81%的 JavaScript）。

## Hugo vs. Astro

[Hugo](https://gohugo.io/)是一个流行的静态网站生成器，由 Go 驱动。

Hugo 使用一个自定义的[模板语言](https://gohugo.io/templates/introduction/)来渲染你的网站。Astro 让你使用你喜欢的 UI 组件库（React、Preact、Vue、Svelte 等）或类似于 HTML/JSX 的内置组件语法来创建页面。Hugo 不支持使用现代 UI 组件进行 HTML 模板制作。

#### 对比 Hugo 及 Astro 性能

从概念上讲，Hugo 与 Astro 的 "最小客户端 JavaScript "的网络开发方法是一致的。Hugo 和 Astro 都提供了类似的、默认为零的 JavaScript 性能基线。

Hugo 和 Astro 都提供了对构建、捆绑和最小化 JavaScript 的内置支持。Astro 会自动从页面中剥离不必要的 JavaScript，只对需要它的个别组件进行渲染。这个功能被称为[局部渲染](/core-concepts/component-hydration)。虽然在 Hugo 中可以自己实现这个功能，但 Astro 默认提供了内置的功能。

## Jekyll vs. Astro

[Jekyll](https://jekyllrb.com/)是一个流行的静态网站生成器，由 Ruby 驱动。

Jekyll 使用一种较早的[模板语言](https://jekyllrb.com/docs/liquid/)来渲染你的网站，称为 Liquid。Astro 让你使用你喜欢的 UI 组件库（React、Preact、Vue、Svelte 和其他）或类似于 HTML/JSX 的内置组件语法来创建页面。Jekyll 不支持使用现代 UI 组件进行 HTML 模板制作。

#### 对比 Jekyll 及 Astro 性能

在概念上，Jekyll 与 Astro 的 "最小客户端 JavaScript "的网站开发方法是一致的。Jekyll 和 Astro 都提供了类似的、默认为零 JavaScript 的性能基线。

Jekyll 通过推动你完全避免使用 JavaScript 来实现这一目标。Jekyll 的网站通常很少甚至没有使用 JavaScript，而是采用服务器端的 HTML 渲染。当你确实需要客户端的 JavaScript 时，这就成了一个问题。这取决于你是否为 Jekyll 创建自己的构建管道。这可能很耗时，并迫使你自己设置捆绑、最小化和其他优化。

相比之下，Astro 自动为你构建客户端的 JavaScript。Astro 只向浏览器发送最低限度的 JavaScript，并对其进行粉碎、捆绑和优化。虽然在 Jekyll 中可以自己实现这一点，但在 Astro 中，这一点是默认内置的。

## SvelteKit vs. Astro

[SvelteKit](https://kit.svelte.dev/)是 Svelte 的一个流行的网站和应用程序框架。

SvelteKit 使用 Svelte 来渲染你的网站。Astro 更加灵活：你可以使用任何 UI 组件库（React、Preact、Vue、Svelte 和其他）或 Astro 的内置组件语法，这与 HTML/JSX 类似。

SvelteKit 和 Astro 都是构建网站的框架。SvelteKit 对高度动态的网站（如仪表盘和收件箱）效果最好，而 Astro 对高度静态的网站（如内容和电子商务网站）效果最好。

SvelteKit 同时支持静态网站生成（SSG）和服务器端渲染（SSR）。如今，Astro 只支持静态网站生成（SSG）。

#### 对比 SvelteKit 及 Astro 性能

在大多数情况下，Astro 网站的加载速度会比 SvelteKit 网站快。这是因为 Astro 会自动从页面中剥离不必要的 JavaScript，只对需要它的个别组件进行渲染。这个功能被称为[局部渲染](/core-concepts/component-hydration)。

SvelteKit 不支持局部渲染，而是让用户在浏览器中加载并重新渲染整个页面，即使大部分页面内容是静态的。这给你的网站带来了更慢的页面加载和更差的性能。SvelteKit 确实提供了对[页面级静态、零 JavaScript 页面](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate)的支持。然而，没有计划对页面上的单个组件进行渲染支持。这使得你在每个页面的交互性方面只能做一个全有或全无的决定。

#### 案例研究 : 构建文档网站

[kit.svelte.dev](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate)是 SvelteKit 的官方文档网站，用 SvelteKit 构建。该网站提供了大量设计模板和功能插件，可以与官方 Astro 文档网站进行比较。让我们对这两个网站构建工具进行一个粗略的真实的比较。以满足这个常见的使用情况。

测试的两个网站之间有一个明显的区别。SvelteKit 的文档是作为一个单一的页面提供的，而 Astro 的文档被分成多个页面。这种较大的内容有效载荷应该会对性能产生轻微的负面影响，这与工具本身无关。

- **SvelteKit 性能得分**。92 分（满分 100 分）[(更多详情)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fkit.svelte.dev%2Fdocs)
- **Astro 性能得分**。95 分（满分 100 分）[(更多详情)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

在这项测试中，SvelteKit 的表现与 Astro 相当。

## Next.js vs. Astro

[Next.js](https://nextjs.org/)是 React 的一个流行的网站和应用程序框架。

Next.js 使用 React 来渲染你的网站。Astro 更灵活：你可以使用任何 UI 组件库（React、Preact、Vue、Svelte 等）或 Astro 的内置组件语法，这与 HTML/JSX 类似。

Next.js 和 Astro 都是构建网站的框架。Next.js 对高度动态的网站（如仪表盘和收件箱）效果最好，而 Astro 对高度静态的网站（如内容和电商网站）效果最好。

Next.js 同时支持静态网站生成（SSG）和服务器端渲染（SSR）。如今，Astro 只支持静态网站生成（SSG）。

#### 对比 Next.js 及 Astro 性能

在大多数情况下，Astro 网站的加载速度将明显高于 Next.js 网站。这是因为 Astro 会自动从页面中剥离不必要的 JavaScript，只对需要它的个别组件进行渲染。这个功能被称为[局部渲染](/core-concepts/component-hydration)。

Next.js 不支持局部渲染，而是让用户在浏览器中加载并重新渲染整个页面，即使页面的大部分内容是静态的。这给你的网站带来了较慢的页面加载和较差的性能。Next.js 对完全静态的零 JavaScript 页面有[实验性支持](https://piccalil.li/blog/new-year-new-website/#heading-no-client-side-react-code)。然而，目前还没有计划支持对页面上的单个组件进行渲染。这让你在每个页面的交互性上都要做出全有或全无的决定。

Next.js 有很好的内置图像优化功能，这可以使 Next.js 成为一些图像密集型网站的更好选择。

#### 案例研究 : 构建文档网站

[nextjs.org/docs](https://nextjs.org/docs/getting-started)是 Next.js 官方文档网站，用 Next.js 构建。该网站提供了足够相似的设计和功能集，可以与官方的 Astro 文档网站进行比较。这为我们提供了一个**_的、真实的、_**的两个静态网站构建工具在这个常见的使用情况下的比较。

- **Next.js 的性能得分**。59 分（满分 100 分）[(更多详情)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnextjs.org%2Fdocs%2Fgetting-started)
- **Astro 性能得分**。95 分（满分 100 分）[(更多详情)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

这种性能差异背后的一个重要原因是 Astro 的 JavaScript 有效载荷较小。[nextjs.org/docs](https://nextjs.org/docs/getting-started)在首次加载时加载了**463kb**的 JavaScript，而[docs.astro.build](https://docs.astro.build)只加载了**9.3kb**（总体而言，JavaScript 减少了 98%）。

## Nuxt vs. Astro

[Nuxt](https://nextjs.org/)是 Vue 的一个流行的网站和应用程序框架。它类似于 Next.js。

Nuxt 使用 Vue 来渲染你的网站。Astro 更灵活：你可以使用任何 UI 组件库（React、Preact、Vue、Svelte 和其他）或 Astro 的内置组件语法，这与 HTML/JSX 类似。

Nuxt 和 Astro 都是构建网站的框架。Nuxt 最适合高度动态的网站（如仪表盘和收件箱），而 Astro 最适合高度静态的网站（如内容和电商网站）。

Nuxt 同时支持静态网站生成（SSG）和服务器端渲染（SSR）。今天，Astro 只支持静态网站生成（SSG）。

#### 对比 Nuxt 及 Astro 性能

在大多数情况下，Astro 网站的加载速度将明显快于 Nuxt 网站。这是因为 Astro 会自动从页面中剥离不必要的 JavaScript，只对需要它的个别组件进行渲染。这个功能被称为[局部渲染](/core-concepts/component-hydration)。

Nuxt 不支持局部渲染，而是让用户在浏览器中加载并重新渲染整个页面，即使大部分的页面内容是静态的。这给你的网站带来了较慢的页面加载和较差的性能。在 Nuxt 中没有办法禁用这种行为。

Nuxt 有很好的内置图片优化功能，这可以使 Nuxt 成为一些图片密集型网站的更好选择。

#### 案例研究 : 构建文档网站

[nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation)是 Nuxt 官方文档网站，用 Nuxt 构建。该网站提供了大量设计模板和功能插件，可以与官方 Astro 文档网站进行比较。让我们对这两个网站构建工具进行一个粗略的真实的比较。

- **新的性能得分**。48 分（满分 100 分）[(更多详情)]（https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnuxtjs.org%2Fdocs%2F2.x%2Fget-started%2Finstallation）
- **Astro 性能得分**。95 分（满分 100 分）[(更多详情)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

这种性能差异背后的一个重要原因是 Astro 的 JavaScript 有效载荷较小。[nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation)在首次加载时加载了**469kb**的 JavaScript，而[docs.astro.build](https://docs.astro.build)只加载了**9.3kb**（总体而言，JavaScript 减少了 98%）。

## VuePress vs. Astro

[VuePress](https://vuepress.vuejs.org/guide/)是一个流行的文档网站建设者。VuePress 使用 Vue.js 来生成你的网站用户界面，而 Astro 支持 React、Vue.js、Svelte 和原始 HTML 模板化。

VuePress 是为建立文档网站而设计的，它有一些内置的、针对文档的网站功能，而 Astro 没有。相反，Astro 通过官方的[`docs`](https://github.com/withastro/astro/tree/main/examples/docs)主题提供了特定的文档功能，你可以在你的网站使用。这个网站就是用这个模板建立的!

#### 对比 VuePress 及 Astro 性能

在大多数情况下，Astro 网站的加载速度将明显快于 VuePress 网站。这是因为 Astro 会自动从页面中剥离不必要的 JavaScript，只对需要它的个别组件进行渲染。这个功能被称为[局部渲染](/core-concepts/component-hydration)。

VuePress 不支持局部渲染，而是让用户在浏览器中加载并重新渲染整个页面，即使页面的大部分内容是静态的。这将使你的网站的页面加载速度变慢，性能变差。在 VuePress 中没有办法禁用这种行为。

#### 案例研究 : 构建文档网站

[vuepress.vuejs.org](https://vuepress.vuejs.org/guide/)是 VuePress 的官方文档网站，用 VuePress 构建。该网站提供了大量设计模板和功能插件，可以与官方 Astro 文档网站进行比较。让我们对这两个网站构建工具进行一个粗略的真实的比较。

- **Vuepress 的性能得分**。63 分（满分 100 分）[(更多详情)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fvuepress.vuejs.org%2Fguide%2F)
- **Astro 性能得分**。95 分（满分 100 分）[(更多详情)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

这种性能差异背后的一个重要原因是 Astro 的 JavaScript 有效载荷较小。[vuepress.vuejs.org](https://vuepress.vuejs.org/guide/)在首次加载时加载了**166kb**的 JavaScript，而[docs.astro.build](https://docs.astro.build)只加载了**9.3kb**（总体来说，JavaScript 少了 95%）。
