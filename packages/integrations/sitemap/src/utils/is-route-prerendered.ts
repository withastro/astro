const REGEX_PRERENDER = /const prerender = true/g;
import { readFile } from 'fs/promises';

export async function isRoutePrerendered(filePath: string) {
	const contents = await readFile(filePath, 'utf-8');

	return REGEX_PRERENDER.test(contents);
}
