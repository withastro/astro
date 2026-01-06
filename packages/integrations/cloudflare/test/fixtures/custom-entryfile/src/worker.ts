import { handle } from '@astrojs/cloudflare/handler'
import { DurableObject } from 'cloudflare:workers';

export class MyDurableObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    // Required, as we're extending the base class.
    super(ctx, env)
  }
}

export default {
	async fetch(request, env, ctx) {
		const response = await handle(request, env, ctx);
		// Clone response to make headers mutable, add custom header to prove custom entrypoint is used
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: {
				...Object.fromEntries(response.headers.entries()),
				'X-Custom-Entrypoint': 'true',
			},
		});
	},

	async queue(batch, _env) {
		let messages = JSON.stringify(batch.messages);
		console.log(`consumed from our queue: ${messages}`);
	}
}
