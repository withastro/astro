/**
 * Type assertions for the `content` option while collection storage drivers are disabled.
 * Type-checked by `tsc` after a build generates `.astro/content.d.ts`: each `@ts-expect-error`
 * fails the check if the line below it type-checks.
 */
import { getCollection, getEntry } from 'astro:content';

export async function checks() {
	// @ts-expect-error The `content` option requires collection storage drivers
	await getEntry('docs', 'intro', { content: false });
	// @ts-expect-error The `content` option requires collection storage drivers
	await getCollection({ name: 'docs', content: false });
	await getCollection({ name: 'docs' });
	await getCollection('docs');
}
