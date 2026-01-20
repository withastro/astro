import type { ExportedHandler } from '@cloudflare/workers-types';
import { handle } from '../utils/handler.js';

export default {
	fetch: handle,
} satisfies ExportedHandler<Cloudflare.Env>;
