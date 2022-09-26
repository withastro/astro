import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX - Vite env vars', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-vite-env-vars/', import.meta.url),
		});
		await fixture.build();
	});

	it('Avoids transforming `import.meta.env` outside JSX expressions', async () => {
		const html = await fixture.readFile('/vite-env-vars/index.html');
		const { document } = parseHTML(html);

		expect(document.querySelector('h1')?.innerHTML).to.contain('import.meta.env.SITE');
		expect(document.querySelector('code')?.innerHTML).to.contain('import.meta.env.SITE');
		expect(document.querySelector('pre')?.innerHTML).to.contain('import.meta.env.SITE');
	});
	it('Allows referencing `import.meta.env` in frontmatter', async () => {
		const { title = '' } = JSON.parse(await fixture.readFile('/frontmatter.json'));
		expect(title).to.contain('import.meta.env.SITE');
	});
	it('Transforms `import.meta.env` in {JSX expressions}', async () => {
		const html = await fixture.readFile('/vite-env-vars/index.html');
		const { document } = parseHTML(html);

		expect(document.querySelector('[data-env-site]')?.innerHTML).to.contain(
			'https://mdx-is-neat.com/blog/cool-post'
		);
	});
	it('Transforms `import.meta.env` in variable exports', async () => {
		const html = await fixture.readFile('/vite-env-vars/index.html');
		const { document } = parseHTML(html);

		expect(document.querySelector('[data-env-variable-exports]')?.innerHTML).to.contain(
			'MODE works'
		);
	});
	it('Transforms `import.meta.env` in HTML attributes', async () => {
		const html = await fixture.readFile('/vite-env-vars/index.html');
		const { document } = parseHTML(html);

		const dataAttrDump = document.querySelector('[data-env-dump]');
		expect(dataAttrDump).to.not.be.null;

		expect(dataAttrDump.getAttribute('data-env-prod')).to.not.be.null;
		expect(dataAttrDump.getAttribute('data-env-dev')).to.be.null;
		expect(dataAttrDump.getAttribute('data-env-base-url')).to.equal('/');
		expect(dataAttrDump.getAttribute('data-env-mode')).to.equal('production');
	});
});
