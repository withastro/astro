import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX - Vite env vars', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-env-variables/', import.meta.url),
		});
		await fixture.build();
	});

	it('Avoids transforming `import.meta.env` outside JSX expressions', async () => {
		const html = await fixture.readFile('/vite-env-vars/index.html');
		const { document } = parseHTML(html);
		console.log(html)

		expect(document.querySelector('h1')?.innerHTML).to.contain('import.meta.env.SITE');
		expect(document.querySelector('code')?.innerHTML).to.contain('import.meta.env.SITE');
		expect(document.querySelector('pre')?.innerHTML).to.contain('import.meta.env.SITE');
	});
	it('Allows referencing `import.meta.env` in frontmatter', async () => {
		const { title = '' } = JSON.parse(await fixture.readFile('/frontmatter.json'));
		expect(title).to.contain('import.meta.env.SITE');
	});
});
