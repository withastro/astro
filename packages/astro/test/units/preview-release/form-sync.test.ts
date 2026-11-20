import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const astroFormDir = new URL('../../../src/preview-release/form/', import.meta.url);
const standardFormDir = new URL('../../../../standard-form/src/', import.meta.url);

/** Every source file below `dir`, relative to it, with a trailing slash on directories. */
async function listFiles(dir: URL, prefix = ''): Promise<Array<string>> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: Array<string> = [];
	for (const entry of entries) {
		const name = `${prefix}${entry.name}`;
		if (entry.isDirectory()) {
			files.push(...(await listFiles(new URL(`${entry.name}/`, dir), `${name}/`)));
		} else {
			files.push(name);
		}
	}
	return files;
}

/**
 * Astro ships its own copy of `@standard-community/standard-form` so the preview can bundle it.
 * The only intended difference is the runtime Zod patch in `handlers.ts`. This test fails when
 * the two copies drift, so a fix has to land in both.
 */
describe('preview-release/form copy', () => {
	it('matches the standard-form source apart from the Zod patch', async () => {
		const astroFiles = (await listFiles(astroFormDir)).sort();
		const standardFiles = (await listFiles(standardFormDir)).sort();
		assert.deepEqual(astroFiles, standardFiles);

		for (const file of astroFiles) {
			const astro = await readFile(new URL(file, astroFormDir), 'utf8');
			const standard = await readFile(new URL(file, standardFormDir), 'utf8');
			const withoutZodPatch = astro
				.split('\n')
				.filter((line) => !line.includes('patchZodStandardSchema'))
				.join('\n');
			assert.equal(withoutZodPatch, standard, `${file} differs from standard-form/src/${file}`);
		}
	});
});
