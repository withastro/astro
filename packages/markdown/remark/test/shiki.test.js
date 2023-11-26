import { createMarkdownProcessor, createShikiHighlighter } from '../dist/index.js';
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
				experimentalThemes: {
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

	it('createShikiHighlighter works', async () => {
		const highlighter = await createShikiHighlighter();

		const html = highlighter.highlight('const foo = "bar";', 'js');

		chai.expect(html).to.contain('astro-code github-dark');
		chai.expect(html).to.contain('background-color:#24292e;color:#e1e4e8;');
	});

	it('diff +/- text has user-select: none', async () => {
		const highlighter = await createShikiHighlighter();

		const html = highlighter.highlight(
			`\
- const foo = "bar";
+ const foo = "world";`,
			'diff'
		);
		chai.expect(html).to.contain('user-select: none');
		chai.expect(html).to.contain('>-</span>');
		chai.expect(html).to.contain('>+</span>');
	});
});
