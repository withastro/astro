---
layout: ~/layouts/Main.astro
title: Partial Hydration in Astro
---

**Astro generates every website with zero client-side JavaScript, by default.** Use any frontend UI component that you'd like (React, Svelte, Vue, etc.) and Astro will automatically render it to HTML at build-time and strip away all JavaScript. This keeps every site fast by default.

But sometimes, client-side JavaScript is required. This guide shows how interactive components work in Astro using a technique called partial hydration.

```astro
---
// Example: Importing and then using a React component.
// By default, Astro renders this to HTML and CSS during
// your build, with no client-side JavaScript.
// (Need client-side JavaScript? Read on...)
import MyReactComponent from '../components/MyReactComponent.jsx';
---
<!-- 100% HTML, Zero JavaScript! -->
<MyReactComponent />
```

## Concept: Partial Hydration

There are plenty of cases where you need an interactive UI component to run in the browser:

- An image carousel
- An auto-complete search bar
- A mobile sidebar open/close button
- A "Buy Now" button

In Astro, it's up to you as the developer to explicitly "opt-in" any components on the page that need to run in the browser. Astro can then use this info to know exactly what JavaScript is needed, and only hydrate exactly what's needed on the page. This technique is known as partial hydration.

**Partial hydration** -- the act of only hydrating the individual components that require JavaScript and leaving the rest of your site as static HTML -- may sound relatively straightforward. It should! Websites have been built this way for decades. It was only recently that Single-Page Applications (SPAs) introduced the idea that your entire website is written in JavaScript and compiled/rendered by every user in the browser.

_Note: Partial hydration is sometimes called "progressive enhancement" or "progressive hydration." While there are slight nuances between the terms, for our purposes you can think of these all as synonyms of the same concept._

**Partial hydration is the secret to Astro's fast-by-default performance story.** Next.js, Gatsby, and other JavaScript frameworks cannot support partial hydration because they imagine your entire website/page as a single JavaScript application.

## Concept: Island Architecture

**Island architecture** is the idea of using partial hydration to build entire websites. Island architecture is an alternative to the popular idea of building your website into a client-side JavaScript bundle that must be shipped to the user.

To quote Jason Miller, who [coined the phrase](https://jasonformat.com/islands-architecture/):

> In an "islands" model, server rendering is not a bolt-on optimization aimed at improving SEO or UX. Instead, it is a fundamental part of how pages are delivered to the browser. The HTML returned in response to navigation contains a meaningful and immediately renderable representation of the content the user requested.

Besides the obvious performance benefits of sending less JavaScript down to the browser, there are two key benefits to island architecture:

- **Components load individually.** A lightweight component (like a sidebar toggle) will load and render quickly without being blocked by the heavier components on the page.
- **Components render in isolation.** Each part of the page is an isolated unit, and a performance issue in one unit won't directly affect the others.

![diagram](https://res.cloudinary.com/wedding-website/image/upload/v1596766231/islands-architecture-1.png)

## Hydrate Interactive Components

Astro renders every component on the server **at build time**. To hydrate components on the client **at runtime**, you may use any of the following `client:*` directives. A directive is a component attribute (always with a `:`) which tells Astro how your component should be rendered.

```astro
---
// Example: hydrating a React component in the browser.
import MyReactComponent from '../components/MyReactComponent.jsx';
---
<!-- "client:visible" means the component won't load any client-side
     JavaScript until it becomes visible in the user's browser. -->
<MyReactComponent client:visible />
```

### `<MyComponent client:load />`

Hydrate the component on page load.

### `<MyComponent client:idle />`

Hydrate the component as soon as main thread is free (uses [requestIdleCallback()][mdn-ric]).

### `<MyComponent client:visible />`

Hydrate the component as soon as the element enters the viewport (uses [IntersectionObserver][mdn-io]). Useful for content lower down on the page.

### `<MyComponent client:media={QUERY} />`

Hydrate the component as soon as the browser matches the given media query (uses [matchMedia][mdn-mm]). Useful for sidebar toggles, or other elements that should only display on mobile or desktop devices.

## Can I Hydrate Astro Components?

[Astro components](./astro-components) (`.astro` files) are HTML-only templating components with no client-side runtime. If you try to hydrate an Astro component with a `client:` modifier, you will get an error.

To make your Astro component interactive, you will need to convert it to the frontend framework of your choice: React, Svelte, Vue, etc. If you have no preference, we recommend React or Preact as they are most similar to Astro's syntax.

Alternatively, you could add a `<script>` tag to your Astro component HTML template and send JavaScript to the browser that way. While this is fine for the simple stuff, we recommend a frontend framework for more complex interactive components.

[mdn-io]: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
[mdn-ric]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
[mdn-mm]: https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
