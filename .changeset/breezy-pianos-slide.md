---
'@astrojs/cloudflare': minor
---

Adds new configuration options to allow you to set a custom `workerEntryPoint` for Cloudflare Workers. This is useful if you want to use features that require handlers (e.g. Durable Objects, Cloudflare Queues, Scheduled Invocations) not supported by the basic generic entry file.

This feature is not supported when running the Astro dev server. However, you can run `astro build` followed by either `wrangler deploy` (to deploy it) or `wrangler dev` to preview it.

The following example configures a custom entry file registers a Durable Object and a queue handler:

```ts
// astro.config.ts
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: cloudflare({
		workerEntryPoint: {
			path: 'src/worker.ts',
			exports: ['default','MyDurableObject']
		}
	}),
});
```

```ts
// src/worker.ts
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
