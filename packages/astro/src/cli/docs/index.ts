import { openInBrowser } from './open.js';

export async function docs() {
	return await openInBrowser('https://docs.astro.build/');
}
