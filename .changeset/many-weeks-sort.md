---
'astro': minor
---

Form support in View Transitions router

The `<ViewTransitions />` router can now handle form submissions, allowing the same animated transitions and stateful UI retention on form posts that are already available on `<a>` links. With this addition, your Astro project can have animations in all of these scenarios:

- Clicking links between pages.
- Making stateful changes in forms (i.e. updating site preferences).
- Manually triggering navigation via the `navigate()` API.

This feature is opt-in for semver reasons and can be enabled by adding the `handleForms` prop to the `<ViewTransitions /> component:

```astro
---
// src/layouts/MainLayout.astro
import { ViewTransitions } from 'astro:transitions';
---

<html>
  <head>
    <!-- ... -->
    <ViewTransitions handleForms />
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

Just as with links, if you don't want the routing handling a form submission, you can opt out on a per-form basis with the `data-astro-reload` property:

```astro
---
// src/components/Contact.astro
---
<form class="contact-form" action="/request" method="post" data-astro-reload>
  <!-- ...-->
</form>
```

Form support works on post `method="get"` and `method="post"` forms.
