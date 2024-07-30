---
'@astrojs/react': patch
'astro': patch
---

**BREAKING CHANGE to the experimental Actions API only.** Install the latest `@astrojs/react` integration as well if you're using React 19 features.

Updates the Astro Actions fallback to support `action={actions.name}` instead of using `getActionProps().` This will submit a form to the server in zero-JS scenarios using a search parameter:

```astro
---
import { actions } from 'astro:actions';
---

<form action={actions.logOut}>
<!--output: action="?_astroAction=logOut"-->
  <button>Log Out</button>
</form>
```

You may also construct form action URLs using string concatenation, or by using the `URL()` constructor, with the an action's `.queryString` property:

```astro
---
import { actions } from 'astro:actions';

const confirmationUrl = new URL('/confirmation', Astro.url);
confirmationUrl.search = actions.queryString;
---

<form method="POST" action={confirmationUrl.pathname}>
  <button>Submit</button>
</form>
```

## Migration

`getActionProps()` is now deprecated. To use the new fallback pattern, remove the `getActionProps()` input from your form and pass your action function to the form `action` attribute:

```diff
---
import {
  actions,
- getActionProps,  
} from 'astro:actions';
---

+ <form method="POST" action={actions.logOut}>
- <form method="POST">
- <input {...getActionProps(actions.logOut)} />
  <button>Log Out</button>
</form>
```
