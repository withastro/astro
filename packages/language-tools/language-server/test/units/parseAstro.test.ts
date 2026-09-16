import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getAstroMetadata } from '../../dist/core/parseAstro.js';

describe('parseAstro - Can parse astro files', () => {
	it('Reports the frontmatter range', () => {
		const input = `---\n--- <div>Astro!</div>`;
		const metadata = getAstroMetadata('file.astro', input);

		assert.deepStrictEqual(metadata.frontmatter, {
			status: 'closed',
			position: {
				start: {
					line: 1,
					offset: 0,
					column: 1,
				},
				end: {
					line: 2,
					column: 4,
					offset: 7,
				},
			},
		});
	});

	it('properly return frontmatter states', () => {
		const inputClosed = `---\n--- <div>Astro!</div>`;
		assert.strictEqual(getAstroMetadata('file.astro', inputClosed).frontmatter.status, 'closed');

		const inputOpen = `---\n<div>Astro!</div>`;
		assert.strictEqual(getAstroMetadata('file.astro', inputOpen).frontmatter.status, 'open');

		const inputNull = `<div>Astro!</div>`;
		assert.strictEqual(
			getAstroMetadata('file.astro', inputNull).frontmatter.status,
			'doesnt-exist',
		);
	});
});
