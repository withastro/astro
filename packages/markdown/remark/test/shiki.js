import { createMarkdownProcessor } from '../dist/index.js';
import chai from 'chai';

describe('shiki syntax highlighting', async () => {
	const processor = await createMarkdownProcessor();

	it('does not add is:raw to the output', async () => {
		const { code } = await processor.render('```\ntest\n```');

		chai.expect(code).not.to.contain('is:raw');
	});
});
