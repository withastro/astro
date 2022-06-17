import { renderMarkdown } from '../dist/index.js';
import chai from 'chai';

describe('expressions', () => {
	it('should be able to serialize bare expression', async () => {
		const { code } = await renderMarkdown(`{a}`, {});

		chai.expect(code).to.equal(`{a}`);
	});

	it('should be able to serialize expression inside component', async () => {
		const { code } = await renderMarkdown(`<Component>{a}</Component>`, {});

		chai.expect(code).to.equal(`<Component>{a}</Component>`);
	});

	it('should be able to serialize expression inside markdown', async () => {
		const { code } = await renderMarkdown(`# {frontmatter.title}`, {});

		chai
			.expect(code)
			.to.equal(`<h1 id={$$slug(\`\${frontmatter.title}\`)}>{frontmatter.title}</h1>`);
	});

	it('should be able to serialize complex expression inside markdown', async () => {
		const { code } = await renderMarkdown(`# Hello {frontmatter.name}`, {});

		chai
			.expect(code)
			.to.equal(`<h1 id={$$slug(\`Hello \${frontmatter.name}\`)}>Hello {frontmatter.name}</h1>`);
	});

	it('should be able to serialize complex expression with markup inside markdown', async () => {
		const { code } = await renderMarkdown(`# Hello <span>{frontmatter.name}</span>`, {});

		chai
			.expect(code)
			.to.equal(
				`<h1 id={$$slug(\`Hello \${frontmatter.name}\`)}>Hello <span>{frontmatter.name}</span></h1>`
			);
	});

	it('should be able to avoid evaluating JSX-like expressions in an inline code & generate a slug for id', async () => {
		const { code } = await renderMarkdown(`# \`{frontmatter.title}\``, {});

		chai
			.expect(code)
			.to.equal('<h1 id="frontmattertitle"><code is:raw>{frontmatter.title}</code></h1>');
	});

	it('should be able to avoid evaluating JSX-like expressions in inline codes', async () => {
		const { code } = await renderMarkdown(`# \`{ foo }\` is a shorthand for \`{ foo: foo }\``, {});

		chai
			.expect(code)
			.to.equal(
				'<h1 id="-foo--is-a-shorthand-for--foo-foo-"><code is:raw>{ foo }</code> is a shorthand for <code is:raw>{ foo: foo }</code></h1>'
			);
	});

	it('should be able to avoid evaluating JSX-like expressions & escape HTML tag characters in inline codes', async () => {
		const { code } = await renderMarkdown(
			`###### \`{}\` is equivalent to \`Record<never, never>\` <small>(at TypeScript v{frontmatter.version})</small>`,
			{}
		);

		chai
			.expect(code)
			.to.equal(
				`<h6 id={$$slug(\`{} is equivalent to Record&lt;never, never&gt; (at TypeScript v\${frontmatter.version})\`)}><code is:raw>{}</code> is equivalent to <code is:raw>Record&lt;never, never&gt;</code> <small>(at TypeScript v{frontmatter.version})</small></h6>`
			);
	});

	it('should be able to serialize function expression', async () => {
		const { code } = await renderMarkdown(
			`{frontmatter.list.map(item => <p id={item}>{item}</p>)}`,
			{}
		);

		chai.expect(code).to.equal(`{frontmatter.list.map(item => <p id={item}>{item}</p>)}`);
	});
});
