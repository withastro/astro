import { createMarkdownProcessor } from '../dist/index.js';
import chai from 'chai';

describe('shiki syntax highlighting', () => {
	it('does not add is:raw to the output', async () => {
		const processor = await createMarkdownProcessor();
		const { code } = await processor.render('```\ntest\n```');

		chai.expect(code).not.to.contain('is:raw');
	});

	it('supports light/dark themes', async () => {
		const processor = await createMarkdownProcessor({
			shikiConfig: {
				themes: {
					light: 'github-light',
					dark: 'github-dark',
				},
			},
		});
		const { code } = await processor.render('```\ntest\n```');

		// light theme is there:
		chai.expect(code).to.contain('background-color:');
		chai.expect(code).to.contain('github-light');
		// dark theme is there:
		chai.expect(code).to.contain('--shiki-dark-bg:');
		chai.expect(code).to.contain('github-dark');
	});
});
