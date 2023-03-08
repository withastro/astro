import { parseHTML } from 'linkedom';
import { parse as parseDevalue } from 'devalue';
import { expect } from 'chai';
import { loadFixture, fixLineEndings } from '../../../astro/test/test-utils.js';
import markdoc from '../dist/index.js';

function formatPost(post) {
	return {
		...post,
		body: fixLineEndings(post.body),
	};
}

const root = new URL('./fixtures/content-collections/', import.meta.url);

describe('Markdoc - Content Collections', () => {
	let baseFixture;

	before(async () => {
		baseFixture = await loadFixture({
			root,
			integrations: [markdoc()],
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await baseFixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('loads entry', async () => {
			const res = await baseFixture.fetch('/entry.json');
			const post = parseDevalue(await res.text());
			expect(formatPost(post)).to.deep.equal(simplePostEntry);
		});

		it('loads collection', async () => {
			const res = await baseFixture.fetch('/collection.json');
			const posts = parseDevalue(await res.text());
			expect(posts).to.not.be.null;
			expect(posts.sort().map((post) => formatPost(post))).to.deep.equal([
				simplePostEntry,
				withComponentsEntry,
				withConfigEntry,
			]);
		});

		it('renders content - simple', async () => {
			const res = await baseFixture.fetch('/content-simple');
			const html = await res.text();
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Simple post');
			const p = document.querySelector('p');
			expect(p.textContent).to.equal('This is a simple Markdoc post.');
		});

		it('renders content - with config', async () => {
			const fixture = await getFixtureWithConfig();
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/content-with-config');
			const html = await res.text();
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Post with config');
			const textContent = html;

			expect(textContent).to.not.include('Hello');
			expect(textContent).to.include('Hola');
			expect(textContent).to.include(`Konnichiwa`);

			await server.stop();
		});

		it('renders content - with components', async () => {
			const fixture = await getFixtureWithComponents();
			const server = await fixture.startDevServer();

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

			await server.stop();
		});
	});

	describe('build', () => {
		before(async () => {
			await baseFixture.build();
		});

		it('loads entry', async () => {
			const res = await baseFixture.readFile('/entry.json');
			const post = parseDevalue(res);
			expect(formatPost(post)).to.deep.equal(simplePostEntry);
		});

		it('loads collection', async () => {
			const res = await baseFixture.readFile('/collection.json');
			const posts = parseDevalue(res);
			expect(posts).to.not.be.null;
			expect(posts.sort().map((post) => formatPost(post))).to.deep.equal([
				simplePostEntry,
				withComponentsEntry,
				withConfigEntry,
			]);
		});

		it('renders content - simple', async () => {
			const html = await baseFixture.readFile('/content-simple/index.html');
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Simple post');
			const p = document.querySelector('p');
			expect(p.textContent).to.equal('This is a simple Markdoc post.');
		});

		it('renders content - with config', async () => {
			const fixture = await getFixtureWithConfig();
			await fixture.build();

			const html = await fixture.readFile('/content-with-config/index.html');
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Post with config');
			const textContent = html;

			expect(textContent).to.not.include('Hello');
			expect(textContent).to.include('Hola');
			expect(textContent).to.include(`Konnichiwa`);
		});

		it('renders content - with components', async () => {
			const fixture = await getFixtureWithComponents();
			await fixture.build();

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

function getFixtureWithConfig() {
	return loadFixture({
		root,
		integrations: [
			markdoc({
				variables: {
					countries: ['ES', 'JP'],
				},
				functions: {
					includes: {
						transform(parameters) {
							const [array, value] = Object.values(parameters);
							return Array.isArray(array) ? array.includes(value) : false;
						},
					},
				},
			}),
		],
	});
}

function getFixtureWithComponents() {
	return loadFixture({
		root,
		integrations: [
			markdoc({
				nodes: {
					fence: {
						render: 'Code',
						attributes: {
							language: { type: String },
							content: { type: String },
						},
					},
				},
				tags: {
					mq: {
						render: 'CustomMarquee',
						attributes: {
							direction: {
								type: String,
								default: 'left',
								matches: ['left', 'right', 'up', 'down'],
								errorLevel: 'critical',
							},
						},
					},
				},
			}),
		],
	});
}

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
	body: '\n## Post with config\n\n{% if includes($countries, "EN") %} Hello {% /if %}\n{% if includes($countries, "ES") %} Hola {% /if %}\n{% if includes($countries, "JP") %} Konnichiwa {% /if %}\n',
};
