---
'astro': minor
---

Form support in ViewTransitions router

The `<ViewTransitions />` router can now handle form submissions, allowing you to retain stateful UI. This feature is opt-in for semver reasons and can be enabled by adding the `handleForms` prop to the component like so:

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

Like with links, you can opt-out of the router handling a submission on a per-form basis with the `data-astro-reload` property:

```astro
---
// src/components/Contact.astro
---
<form class="contact-form" action="/request" method="post" data-astro-reload>
  <!-- ...-->
</form>
```

Form support works on post `method="get"` and `method="post"` forms.
