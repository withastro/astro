import { promises as fs } from 'node:fs';

import type { APIRoute } from 'astro';

// NOTE: test deprecated object form
export const GET: APIRoute = async function get() {
	try {
		// Image is in the public domain. Sourced from
		// https://en.wikipedia.org/wiki/File:Portrait_placeholder.png
		const buffer = await fs.readFile('./test/fixtures/non-html-pages/src/images/placeholder.png');
		return {
			body: buffer.toString('binary'),
			encoding: 'binary',
		} as const;
	} catch (error: unknown) {
		throw new Error(`Something went wrong in placeholder.png route!: ${error as string}`);
	}
};
