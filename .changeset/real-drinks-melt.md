---
'astro': minor
---

Improved hoisted script bundling

Astro uses static analysis to determine which `<script>` to bundle together. This allows us to create bundles that optimize script usage between pages and place them in the head of the document so that they are downloaded as early as possible. The downside is that you cannot dynamically use hoisted scripts.

Now Astro has improved the static analysis to take into account the imports used. If you have a library that re-exports components like so:

__@matthewp/my-astro-lib__

```js
export { default as Tabs } from './Tabs.astro';
export { default as Accordion } from './Accordion.astro';
```

Then let's say you have a page that uses just the Accordion like so:

```astro
---
import { Accordion } from '@matthewp/my-astro-lib';
---
```

Previously Astro would bundle `<script>`s from both the Tabs and Accordion onto this page, even though on the Accordion is used. Now Astro is a little smarter and can support this re-export pattern that is common among libraries.
