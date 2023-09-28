---
'astro': minor
---

View transitions can now be triggered from JavaScript!

Import the client-side router from "astro:transitions/client" and enjoy your new remote control for navigation:

```js
import { navigate } from 'astro:transitions/client';

// Navigate to the selected option automatically.
document.querySelector('select').onchange = (ev) => {
  let href = ev.target.value;
  navigate(href);
};
```
