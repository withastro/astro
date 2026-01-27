import { handle } from '../utils/handler.js';

export default {
	async fetch(request, env, ctx) {
		const response = await handle(request, env, ctx)
		return response
	}
} satisfies ExportedHandler<Env>;
