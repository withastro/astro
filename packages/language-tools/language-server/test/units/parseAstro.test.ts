import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getAstroMetadata } from '../../dist/core/parseAstro.js';
import { createCompilerPoint, createCompilerPosition } from '../utils.ts';

describe('parseAstro - Can parse astro files', () => {
	it('Can parse files', () => {
		const input = `---\n--- <div>Astro!</div>`;
		const metadata = getAstroMetadata('file.astro', input);

		assert.deepStrictEqual(metadata.ast, {
			children: [
				{
					position: createCompilerPosition(
						createCompilerPoint(1, 1, 0),
						createCompilerPoint(2, 4, 7),
					),
					type: 'frontmatter',
					value: '\n',
				},
				{
					attributes: [],
					children: [
						{
							position: createCompilerPosition(
								createCompilerPoint(2, 10, 13),
								createCompilerPoint(2, 16, 19),
							),
							type: 'text',
							value: 'Astro!',
						},
					],
					name: 'div',
					position: createCompilerPosition(
						createCompilerPoint(2, 5, 8),
						createCompilerPoint(2, 22, 25),
					),
					type: 'element',
				},
			],
			type: 'root',
		});
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
		assert.deepStrictEqual(metadata.diagnostics, []);
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
