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
		console.log("env", env)
		await env.MY_QUEUE.send("log");
		return handle(request, env, ctx);
	},

	async queue(batch, _env) {
		let messages = JSON.stringify(batch.messages);
		console.log(`consumed from our queue: ${messages}`);
	}
}
