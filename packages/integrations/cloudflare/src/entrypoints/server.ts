import type { ExportedHandler } from '@cloudflare/workers-types';
import { type Env, handle } from '../utils/handler.js';

const defaultExport = {
	fetch: handle,
} satisfies ExportedHandler<Env> 

export function createExports() {
	return {
		default: defaultExport
	};
}
