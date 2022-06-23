---
'astro': patch
---

Moves head injection to happen during rendering

This change makes it so that head injection; to insert component stylesheets, hoisted scripts, for example, to happen during rendering than as a post-rendering step.

This is to enable streaming. This change will only be noticeable if you are rendering your `<head>` element inside of a framework component. If that is the case then the head items will be injected before the first non-head element in an Astro file instead.

In the future we may offer a `<Astro.Head>` component as a way to control where these scripts/styles are inserted.
