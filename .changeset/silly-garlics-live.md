---
'astro': minor
---

Built-in View Transitions Support (experimental)

Astro now supports [view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/) through the new `<ViewTransitions />` component and the `transition:animate` (and associated) directives. View transitions are a great fit for content-oriented sites, and we see it as the best path to get the benefits of client-side routing (smoother transitions) without sacrificing the more simple mental model of MPAs.

In this release, view transitions are enabled by add the experimental flag to your config:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    viewTransitions: true,
  },
})
```

This enables you to use the new APIs added.

## <ViewTransitions />

This is a component which acts as the *router* for transitions between pages. You need to add it to each page, in the `<head>` section, in which you want to have transitions away from be done in-client. To enable support throughout your entire app, add the component in some common layout or component.

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

## Animations

Using `transition:animate` you can use some of our built-in animations. For example:

```astro
<header transition:animate="slide">
```

Will perform an animation in which the element slides out to the left, and slides in from the right. You can also customize these animations by specifying a duration like so:

```astro
---
import { slide } from 'astro:transition';
---
<header transition:animate={slide({ duration: 200 })}>
```

## Continue learning

Check out the [client-side routing docs](https://docs.astro.build/en/guides/client-side-routing/) to learn more.
