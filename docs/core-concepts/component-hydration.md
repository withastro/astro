---
layout: ~/layouts/Main.astro
title: React, Svelte, Vue, etc.
---

By default, Astro generates your site with zero client-side JavaScript. If you use any frontend UI components (React, Svelte, Vue, etc.) Astro will automatically render them to HTML and strip away any client-side JavaScript. This keeps your site default-fast.

```
---
import MyReactComponent from '../components/MyReactComponent.jsx';
---
<!-- By default: Astro renders this to HTML
     and strips away all JavaScript. -->
<MyReactComponent />
```

However, there are plenty of cases where you might like to include an interactive component on your page:

- An image carousel
- An auto-complete search bar
- A mobile sidebar open/close button
- A "Buy Now" button

With Astro, you can hydrate these components individually, without forcing the rest of the page to ship any other unnecesary JavaScript. This technique is called **partial hydration.**

## Hydrate Frontend Components

To hydrate your components in the client, you may use any of the following techniques:

- `<MyComponent:load />` will render the component on page load.
- `<MyComponent:idle />` will use [requestIdleCallback()][mdn-ric] to render the component as soon as main thread is free.
- `<MyComponent:visible />` will use an [IntersectionObserver][mdn-io] to render the component when the element enters the viewport.

## Hydrate Astro Components

Astro components (`.astro`) are HTML-only templating languages with no client-side runtime. You cannot hydrate an Astro component to run on the client (because the JavaScript front-matter only ever runs at build time).

If you want to make your Astro component interactive on the client, you should convert it to React, Svelte, or Vue. Otherwise, you can consider adding a `<script>` tag to your Astro component that will run JavaScript on the page.
