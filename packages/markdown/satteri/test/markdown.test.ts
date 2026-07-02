import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { HastPluginDefinition, MdastPluginDefinition } from 'satteri';
import { createSatteriMarkdownProcessor, satteriHeadingIdsPlugin } from '../dist/index.js';

describe('satteri markdown', () => {
	it('renders basic markdown', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { code } = await processor.render('# Title\n\nSome **bold** text.');
		assert.match(code, /<h1 id="title">Title<\/h1>/);
		assert.match(code, /<strong>bold<\/strong>/);
	});

	it('collects headings into metadata', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { metadata } = await processor.render(
			'# One\n\n## Two\n\n### Three\n\n#### Four\n\n##### Five\n\n###### Six',
		);
		assert.deepEqual(metadata.headings, [
			{ depth: 1, slug: 'one', text: 'One' },
			{ depth: 2, slug: 'two', text: 'Two' },
			{ depth: 3, slug: 'three', text: 'Three' },
			{ depth: 4, slug: 'four', text: 'Four' },
			{ depth: 5, slug: 'five', text: 'Five' },
			{ depth: 6, slug: 'six', text: 'Six' },
		]);
	});

	it('applies GFM by default', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { code } = await processor.render('Visit https://example.com today');
		assert.match(code, /<a href="https:\/\/example\.com"/);
	});

	it('disables GFM when `gfm: false`', async () => {
		const processor = await createSatteriMarkdownProcessor({ gfm: false });
		const { code } = await processor.render('Visit https://example.com today');
		assert.ok(!code.includes('<a '));
	});

	it('applies smart punctuation by default', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { code } = await processor.render('He said "hello"');
		assert.match(code, /“hello”/);
	});

	it('disables smart punctuation when `smartypants: false`', async () => {
		const processor = await createSatteriMarkdownProcessor({ smartypants: false });
		const { code } = await processor.render('He said "hello"');
		assert.ok(code.includes('"hello"'));
	});

	it('collects local image paths into metadata', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { metadata } = await processor.render('![alt](./local.png)');
		assert.deepEqual(metadata.localImagePaths, ['./local.png']);
	});

	it('lets user plugins read heading IDs when `satteriHeadingIdsPlugin()` runs first', async () => {
		let seenId: unknown;
		const readIdPlugin: HastPluginDefinition = {
			name: 'read-heading-id',
			element: {
				filter: ['h1'],
				visit(node) {
					seenId = node.properties?.id;
				},
			},
		};
		const processor = await createSatteriMarkdownProcessor({
			hastPlugins: [satteriHeadingIdsPlugin(), readIdPlugin],
		});
		await processor.render('# Hello world');
		assert.equal(seenId, 'hello-world');
	});

	it('does not duplicate headings when `satteriHeadingIdsPlugin()` runs as a user plugin too', async () => {
		const processor = await createSatteriMarkdownProcessor({
			hastPlugins: [satteriHeadingIdsPlugin()],
		});
		const { metadata } = await processor.render('## Some text\n\n## Some text');
		assert.deepEqual(metadata.headings, [
			{ depth: 2, slug: 'some-text', text: 'Some text' },
			{ depth: 2, slug: 'some-text-1', text: 'Some text' },
		]);
	});

	it('respects heading IDs set by a user hast plugin in both DOM and `headings`', async () => {
		const setIdPlugin: HastPluginDefinition = {
			name: 'set-heading-id',
			element: {
				filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
				visit(node, ctx) {
					ctx.setProperty(node, 'id', 'custom-id');
				},
			},
		};
		const processor = await createSatteriMarkdownProcessor({
			hastPlugins: [setIdPlugin],
		});
		const { code, metadata } = await processor.render('# Title');
		assert.match(code, /<h1 id="custom-id">Title<\/h1>/);
		assert.deepEqual(metadata.headings, [{ depth: 1, slug: 'custom-id', text: 'Title' }]);
	});

	it('collects image paths after user mdast plugins resolve them', async () => {
		const resolveImage: MdastPluginDefinition = {
			name: 'resolve-image',
			image(node, ctx) {
				if (node.url === './unresolved.png') {
					ctx.setProperty(node, 'url', './resolved.png');
				}
			},
		};
		const processor = await createSatteriMarkdownProcessor({
			mdastPlugins: [resolveImage],
		});
		const { metadata } = await processor.render('![alt](./unresolved.png)');
		assert.deepEqual(metadata.localImagePaths, ['./resolved.png']);
	});

	it('lets a plugin read seeded frontmatter and modify it through ctx.data', async () => {
		const injectPlugin: MdastPluginDefinition = {
			name: 'inject-frontmatter',
			heading(_node, ctx) {
				const astro = ctx.data.astro!;
				astro.frontmatter.injected = String(astro.frontmatter.title).toUpperCase();
			},
		};
		const processor = await createSatteriMarkdownProcessor({
			mdastPlugins: [injectPlugin],
		});
		const { metadata } = await processor.render('# Heading', {
			frontmatter: { title: 'hello' },
		});
		assert.equal(metadata.frontmatter.title, 'hello');
		assert.equal(metadata.frontmatter.injected, 'HELLO');
	});
});
