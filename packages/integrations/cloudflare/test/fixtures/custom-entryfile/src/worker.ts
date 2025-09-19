import type { SSRManifest } from 'astro';

import { App } from 'astro/app';
import { handle } from '@astrojs/cloudflare/handler'
import { DurableObject } from 'cloudflare:workers';

class MyDurableObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    // Required, as we're extending the base class.
    super(ctx, env)
  }
}

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);
	return {
		default: {
			async fetch(request, env, ctx) {
				console.log("env", env)
				await env.MY_QUEUE.send("log");
				// @ts-expect-error - The types are identical, I don't get why this is an error.
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
