import { renderMarkdown } from '../dist/index.js';
import chai from 'chai';

describe('expressions', () => {
	it('should be able to serialize bare expession', async () => {
		const { code } = await renderMarkdown(`{a}`, {});

		chai.expect(code).to.equal(`{a}`);
	});

	it('should be able to serialize expression inside component', async () => {
		const { code } = await renderMarkdown(`<Component>{a}</Component>`, {});

		chai.expect(code).to.equal(`<Fragment>\n<Component>{a}</Component>\n</Fragment>`);
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

	it('should be able to serialize function expression', async () => {
		const { code } = await renderMarkdown(
			`{frontmatter.list.map(item => <p id={item}>{item}</p>)}`,
			{}
		);

		chai.expect(code).to.equal(`{frontmatter.list.map(item => <p id={item}>{item}</p>)}`);
	});
});
