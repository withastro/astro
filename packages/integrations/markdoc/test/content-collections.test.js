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
			expect(posts.sort()).to.deep.equal([
				simplePostEntry,
				{
					id: 'with-components.mdoc',
					slug: 'with-components',
					collection: 'blog',
					data: {
						schemaWorks: true,
						title: 'Post with components',
					},
					body: '\n## Post with components\n\nThis uses a custom marquee component with a shortcode:\n\n{% mq direction="right" %}\nI\'m a marquee too!\n{% /mq %}\n\nAnd a code component for code blocks:\n\n```js\nconst isRenderedWithShiki = true;\n```\n',
				},
				{
					id: 'with-config.mdoc',
					slug: 'with-config',
					collection: 'blog',
					data: {
						schemaWorks: true,
						title: 'Post with config',
					},
					body: '\n## Post with config\n\nThis uses a shortcode to render a marquee element,\nwith a variable to show and hide:\n\n{% if $showMarquee %}\n{% mq direction="down" %}\nIm a marquee!\n{% /mq %}\n{% /if %}\n',
				},
			]);
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
