import { parseHTML } from 'linkedom';
import { parse as parseDevalue } from 'devalue';
import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('Markdoc - Content Collections', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/content-collections/', import.meta.url),
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('loads entry', async () => {
			const res = await fixture.fetch('/entry.json');
			const post = parseDevalue(await res.text());
			expect(post).to.deep.equal(simplePostEntry);
		});

		it('loads collection', async () => {
			const res = await fixture.fetch('/collection.json');
			const posts = parseDevalue(await res.text());
			expect(posts).to.not.be.null;
			expect(posts.sort()).to.deep.equal([simplePostEntry, withComponentsEntry, withConfigEntry]);
		});

		it('renders content - simple', async () => {
			const res = await fixture.fetch('/content-simple');
			const html = await res.text();
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Simple post');
			const p = document.querySelector('p');
			expect(p.textContent).to.equal('This is a simple Markdoc post.');
		});

		it('renders content - with config', async () => {
			const res = await fixture.fetch('/content-with-config');
			const html = await res.text();
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Post with config');
			const marquee = document.querySelector('marquee');
			expect(marquee).to.not.be.null;
			expect(marquee.textContent).to.equal('Im a marquee!');
		});

		it('renders content - with components', async () => {
			const res = await fixture.fetch('/content-with-components');
			const html = await res.text();
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Post with components');

			// Renders custom shortcode component
			const marquee = document.querySelector('marquee');
			expect(marquee).to.not.be.null;
			expect(marquee.hasAttribute('data-custom-marquee')).to.equal(true);

			// Renders Astro Code component
			const pre = document.querySelector('pre');
			expect(pre).to.not.be.null;
			expect(pre.className).to.equal('astro-code');
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('loads entry', async () => {
			const res = await fixture.readFile('/entry.json');
			const post = parseDevalue(res);
			expect(post).to.deep.equal(simplePostEntry);
		});

		it('loads collection', async () => {
			const res = await fixture.readFile('/collection.json');
			const posts = parseDevalue(res);
			expect(posts).to.not.be.null;
			expect(posts.sort()).to.deep.equal([simplePostEntry, withComponentsEntry, withConfigEntry]);
		});

		it('renders content - simple', async () => {
			const html = await fixture.readFile('/content-simple/index.html');
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Simple post');
			const p = document.querySelector('p');
			expect(p.textContent).to.equal('This is a simple Markdoc post.');
		});

		it('renders content - with config', async () => {
			const html = await fixture.readFile('/content-with-config/index.html');
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Post with config');
			const marquee = document.querySelector('marquee');
			expect(marquee).to.not.be.null;
			expect(marquee.textContent).to.equal('Im a marquee!');
		});

		it('renders content - with components', async () => {
			const html = await fixture.readFile('/content-with-components/index.html');
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Post with components');

			// Renders custom shortcode component
			const marquee = document.querySelector('marquee');
			expect(marquee).to.not.be.null;
			expect(marquee.hasAttribute('data-custom-marquee')).to.equal(true);

			// Renders Astro Code component
			const pre = document.querySelector('pre');
			expect(pre).to.not.be.null;
			expect(pre.className).to.equal('astro-code');
		});
	});
});

const simplePostEntry = {
	id: 'simple.mdoc',
	slug: 'simple',
	collection: 'blog',
	data: {
		schemaWorks: true,
		title: 'Simple post',
	},
	body: '\n## Simple post\n\nThis is a simple Markdoc post.\n',
};

const withComponentsEntry = {
	id: 'with-components.mdoc',
	slug: 'with-components',
	collection: 'blog',
	data: {
		schemaWorks: true,
		title: 'Post with components',
	},
	body: '\n## Post with components\n\nThis uses a custom marquee component with a shortcode:\n\n{% mq direction="right" %}\nI\'m a marquee too!\n{% /mq %}\n\nAnd a code component for code blocks:\n\n```js\nconst isRenderedWithShiki = true;\n```\n',
};

const withConfigEntry = {
	id: 'with-config.mdoc',
	slug: 'with-config',
	collection: 'blog',
	data: {
		schemaWorks: true,
		title: 'Post with config',
	},
	body: '\n## Post with config\n\nThis uses a shortcode to render a marquee element,\nwith a variable to show and hide:\n\n{% if $showMarquee %}\n{% mq direction="down" %}\nIm a marquee!\n{% /mq %}\n{% /if %}\n',
};
