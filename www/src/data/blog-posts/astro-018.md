---
title: 'Astro 0.18 Release'
description: 'Introducing: Responsive partial hydration • Solid.js support • Lit SSR support • Named slots • Global style support • and more!'
publishDate: 'July 27, 2021'
author: 'matthew'
lang: 'en'
---

A little over a month ago, the first public beta for Astro was released to the world. Since then, we have been fixing bugs and gathering your feedback on what to tackle next. Today, we are excited to announce the release of some of our most requested features.

We are excited to introduce Astro v0.18, featuring:

* __[Responsive partial hydration:](#responsive-component-hydration)__ Hydrate components with CSS media queries.
* __[Named slots:](#named-slots)__ Support multiple content entrypoints inside of Astro components.
* __[Solid.js support:](#solid-support)__ Use [Solid.js](https://www.solidjs.com/) components in Astro.
* __[Lit support:](#solid-support)__ Use [Lit SSR](https://lit.dev/) to get server-side rendering for web components.
* [`<style global>` support](https://docs.astro.build/guides/styling#overview), [GitHub syntax highlighting](https://twitter.com/n_moore/status/1417881860051509250) and a [shiny new docs site.](https://docs.astro.build/)

## Responsive partial hydration


<img src="/assets/blog/astro-018/responsive-hydration.jpg" alt="Code example that shows off using the new client:media hydrator." />
<!-- Saved from https://carbon.now.sh/16xchqPVdt5IEAY3Czg3 -->

Responsive websites often load components that are only visible on certain device sizes, like a mobile sidebar menu. As a developer, it can be difficult (impossible?) to avoid loading mobile-only code on non-mobile devices. The result is wasted time spent on code that will never even be seen by the end user.

Astro solves the problem of unnecessary JavaScript with [partial hydration](https://docs.astro.build/core-concepts/component-hydration), a technique that involves only hydrating the components that need interactivity and leaving the rest as static HTML. **Astro v0.18 adds a new way to customize partial hydration using [CSS media queries](https://docs.astro.build/core-concepts/component-hydration#mycomponent-clientmediaquery-) that avoid sending code to devices that don't need it.**

Add the `client:media` directive to a component and it will only hydrate once the media condition is met. On a mobile phone? Skip any expensive and unneccesary JavaScript for the desktop header that you'll never see. On a desktop or laptop? Don't load that mobile hamburger menu. This is all part of Astro's commitment to minimizing the unnecesary JavaScript that you send to your users.

## Named slots in Astro components

![Using multiple slots to provide the head and body parts of a Layout component.](/assets/blog/astro-018/named-slots.png)
<!-- https://carbon.now.sh/9UwJkMCezRIOhzac5VVp -->

[Named slots](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots) are a standard web feature used in [browser APIs](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots) and web frameworks like [Vue](https://vuejs.org/v2/guide/components-slots.html#Named-Slots). In this release, [Astro adds support for named slots](https://docs.astro.build/core-concepts/astro-components#slots) to Astro components, pages, and layouts.

Named slots are particularly useful for page layouts. A layout can now specify slots for different sections of the page. You can put metadata tags in "head" slot, and page content in the "body" or "content" slot. Your layout is now completely customizable, with as many or as few slots as you need.


## Solid support

<img src="/assets/blog/astro-018/solid-logo-dark.svg" alt="Solid.js logo" style="background-color: rgb(65, 64, 66); padding: 2rem 4rem;" />

[Solid](https://www.solidjs.com/) is a JSX-based UI framework that bills itself as the familiar, modern, more reactive alternative to React. We're really excited about Solid, and with the new [Solid renderer](https://github.com/snowpackjs/astro/tree/main/packages/renderers/renderer-solid) for Astro you can use Solid as a first-class framework in your project.

Adding support for Solid (our third officially-supported JSX framework) wasn't easy, and required a major refactoring of how Astro handles JSX. The final result was worth it: Astro is now much better at supporting different types of JSX and can even support the new React v17 JSX transform. This new foundation for Astro should support us well into the future.

The release of Solid v1.0 is the perfect showcase for Astro's multi-framework promise: try out your first Solid component in an existing project side-by-side with the rest of your components. Where other build tools force you to choose a single framework and stick with it, Astro makes multi-framework projects easy for short-term code migrations or long-term site architectures.


## Lit SSR support

![Lit logo](/assets/blog/astro-018/lit-logo.svg)

Server-side rendering (SSR) for web components is finally here, thanks to Lit and the new [Lit renderer for Astro](https://github.com/snowpackjs/astro/tree/main/packages/renderers/renderer-lit).

Thanks to the [Declarative Shadow DOM](https://web.dev/declarative-shadow-dom/) -- a new HTML feature that's now available in Chrome -- the Lit project was able to release experimental SSR support for Lit. Define a custom element in JavaScript and server render it with Astro as you would any other component from React or Vue. Unlike other JS components, you still use the custom element tag name in your HTML.

The Lit SSR renderer is experimental, and some existing web components may not work with the new API. As other web component libraries adopt declarative shadow DOM and common APIs emerge for rendering, we hope to bring support to those libraries as well. We will keep refining and improving this support as we move towards Astro v1.0.

## Community

We've been absolutely blown away by the love Astro has recieved in such a short amount of time:

- Featured articles and guides from [Netlify](https://www.netlify.com/blog/2021/07/23/build-a-modern-shopping-site-with-astro-and-serverless-functions/), [Cloudflare](https://developers.cloudflare.com/pages/framework-guides/astro), [CSS Tricks](https://css-tricks.com/a-look-at-building-with-astro/), and more.
- Over 2,000 developers have downloaded the [Astro VSCode extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode)
- Over 500 weekly visitors to our [amazing Discord](https://astro.build/chat)
- Over 300 public projects using Astro [on Github](https://github.com/snowpackjs/astro)
- 2 (TWO!) Astro jobs already posted on Discord!
- [GitHub adds support for Astro component syntax highlighting](https://twitter.com/n_moore/status/1417881860051509250)

To learn more about Astro and start building your first site, check out [the Getting Started guide.](https://docs.astro.build)
