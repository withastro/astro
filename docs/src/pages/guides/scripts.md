---
layout: ~/layouts/MainLayout.astro
title: Scripts
---

Astro automatically adds script tags for your partially hydrated components and bundles those in production.

Any other script that you want to run in your page you'll add it by adding a `<script>` somewhere in your page, or within a component. 

# Hoisted scripts

By default Astro does not make any assumptions on how you want scripts to be served, so if you add a `<script>` tag in a page or a component it will be left alone.

However if you'd like all of your scripts to be hoisted out of components and moved to the top of the page, and then later bundled together in production, you can achieve this with hoisted scripts.

A __hoisted script__ looks like this:

```astro
<script hoist>
  // An inline script
</script>
```

Or it can link to an external JavaScript file:

```astro
<script src={Astro.resolve('./my-component.js')} hoist></script>
```

A hoisted script can be within a page or a component, and no matter how many times the component is used, the script will only be added once:

```astro
---
import TwitterTimeline from '../components/TwitterTimeline.astro';
---

<-- The script will only be injected into the head once. -->
<TwitterTimeline />
<TwitterTimeline />
<TwitterTimeline />
```