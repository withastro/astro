import { renderMarkdown } from '../dist/index.js';
import chai, { expect } from 'chai';

describe('metadata', () => {
	it('should be able to extract all headings', async () => {
		const { metadata } = await renderMarkdown(
			`# Alpha
			## Bravo
			### Charlie
			## Delta`, 
			{}
		);

		const expectedHeaders = [
			{ depth: 1, slug: 'alpha', text: 'Alpha' },
			{ depth: 2, slug: 'bravo', text: 'Bravo' },
			{ depth: 3, slug: 'charlie', text: 'Charlie' },
			{ depth: 2, slug: 'delta', text: 'Delta' }
		];

		chai.expect(metadata.headers).to.deep.equal(expectedHeaders);
	});

	it('should have empty headers when content has no headings', async () => {
		const { metadata } = await renderMarkdown(`*emphasized*`, {});
		chai.expect(metadata.headers).to.be.empty;
	});
});
