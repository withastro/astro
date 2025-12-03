---
'@astrojs/cloudflare': major
---

Changes the API for creating a custom `entrypoint`, replacing the `createExports()` function with a direct export pattern. 

#### What should I do?

If you're using a custom `entryPoint` in your Cloudflare adapter config, update your existing worker file that uses `createExports()` to reflect the new, simplified pattern:


```ts
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { handle } from '@astrojs/cloudflare/handler'
import { DurableObject } from 'cloudflare:workers';

class MyDurableObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
  }
}

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);
  return {
    default: {
      async fetch(request, env, ctx) {
        await env.MY_QUEUE.send("log");
        return handle(manifest, app, request, env, ctx);
      },
      async queue(batch, _env) {
        let messages = JSON.stringify(batch.messages);
        console.log(`consumed from our queue: ${messages}`);
      }
    } satisfies ExportedHandler<Env>,
    MyDurableObject: MyDurableObject,
  }
}
```

to:

```ts
import { handle } from '@astrojs/cloudflare/utils/handler';

export default {
  async fetch(request, env, ctx) {
    await env.MY_QUEUE.send("log");
    return handle(manifest, app, request, env, ctx);
  },
  async queue(batch, _env) {
    let messages = JSON.stringify(batch.messages);
    console.log(`consumed from our queue: ${messages}`);
  }
} satisfies ExportedHandler<Env>,
```

The manifest is now created internally by the adapter.
