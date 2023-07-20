---
'astro': minor
---

Improved hoisted script bundling

Astro's static analysis to determine which `<script>` tags to bundle together just got a little smarter!

Astro create bundles that optimize script usage between pages and place them in the head of the document so that they are downloaded as early as possible. One limitation to Astro's existing approach has been that you could not dynamically use hoisted scripts. Each page received the same, all-inclusive bundle whether or not every script was needed on that page.

Now, Astro has improved the static analysis to take into account the actual imports used. 

For example, Astro would previously bundle the `<script>`s from both the `<Tab>` and `<Accordian>`  component for the following library that re-exports multiple components:

__@matthewp/my-astro-lib__

```js
export { default as Tabs } from './Tabs.astro';
export { default as Accordion } from './Accordion.astro';
```

Now, when an Astro page only uses a single component, Astro will send only the necessary script to the page. A page that only imports the `<Accordian>` component will not receive any `<Tab>` component's scripts:

```astro
---
import { Accordion } from '@matthewp/my-astro-lib';
---
```

You should now see more efficient performance with Astro now supporting this common library re-export pattern.
