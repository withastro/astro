---
'@astrojs/cloudflare': minor
---

Adds the option to set a custom workerEntryPoint. This feature is only supported for Cloudflare Workers and when you use `astro build`. Below is an example on how to use it to register a Durable Object and a queue handler.

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
