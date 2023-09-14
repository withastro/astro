---
'@astrojs/cloudflare': patch
---

add option to type environment variables using a generic

```ts
// src/env.d.ts
/// <reference types="astro/client" />
import type { AdvancedRuntime } from '@astrojs/cloudflare';

type ENV = {
  SERVER_URL: string;
}

declare namespace App {
  interface Locals extends AdvancedRuntime<ENV> {
    user: {
      name: string;
      surname: string;
    };
  }
}
```


```ts
// src/env.d.ts
/// <reference types="astro/client" />
import type { DirectoryRuntime } from '@astrojs/cloudflare';

type ENV = {
  SERVER_URL: string;
}

declare namespace App {
  interface Locals extends DirectoryRuntime<ENV> {
    user: {
      name: string;
      surname: string;
    };
  }
}
```
