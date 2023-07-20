---
'astro': minor
---

Built-in View Transitions Support (experimental)

Astro now supports [view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/) through the new `<ViewTransitions />` component and the `transition:animate` (and associated) directives. View transitions are a great fit for content-oriented sites, and we see it as the best path to get the benefits of client-side routing (smoother transitions) without sacrificing the more simple mental model of MPAs.

Enable support for view transitions in Astro 2.9 by adding the experimental flag to your config:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    viewTransitions: true,
  },
})
```

This enables you to use the new APIs added.

#### <ViewTransitions />

This is a component which acts as the *router* for transitions between pages. Add it to the `<head>` section of each individual page where transitions should occur *in the client* as you navigate away to another page, instead of causing a full page browser refresh. To enable support throughout your entire app, add the component in some common layout or component that targets the `<head>` of every page.

__CommonHead.astro__

```astro
---
import { ViewTransitions } from 'astro:transitions';
---

<meta charset="utf-8">
<title>{Astro.props.title}</title>
<ViewTransitions />
```

With only this change, your app will now route completely in-client. You can then add transitions to individual elements using the `transition:animate` directive.

#### Animations

Add `transition:animate` to any element to use Astro's built-in animations.

```astro
<header transition:animate="slide">
```

In the above, Astro's `slide` animation will cause the `<header>` element to slide out to the left, and then slide in from the right when you navigate away from the page.

You can also customize these animations using any CSS animation properties, for example, by specifying a duration:

```astro
---
import { slide } from 'astro:transition';
---
<header transition:animate={slide({ duration: 200 })}>
```

#### Continue learning

Check out the [client-side routing docs](https://docs.astro.build/en/guides/client-side-routing/) to learn more.
