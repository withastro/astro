/// <reference types="vite/client" />

import type { ExportedHandler } from '@cloudflare/workers-types';
import { type Env, handle } from '../utils/handler.js';

export default {
	async fetch(request, env, ctx) {
		return await handle(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
