---
'astro': patch
---

Fixes a case where Astro allowed to call an action without using `Astro.callAction`. This is now invalid, and Astro will show a proper error.

```diff
---
import { actions } from "astro:actions";

-const result = actions.getUser({ userId: 123 });
+const result = Astro.callAction(actions.getUser, { userId: 123 });
---
```
