import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import markdown from '../../../dist/vite-plugin-markdown/index.js';
import { createBasicSettings, createFixture, defaultLogger } from '../test-utils.ts';

describe('astro:markdown layout frontmatter', () => {
	let fixture: Awaited<ReturnType<typeof createFixture>>;
	let load: (id: string) => Promise<{ code: string }>;
	let filePath: string;

	before(async () => {
		fixture = await createFixture({
			'/src/content/post.md': '---\ntitle: Post\nlayout: demo\n---\n\n# Hello\n',
		});
		filePath = path.join(fixture.path, 'src/content/post.md');
		const settings = await createBasicSettings({ root: fixture.path });
		const plugin = markdown({ settings, logger: defaultLogger }) as any;
		load = (id) => plugin.load.handler.call({}, id);
	});

	after(async () => {
		await fixture.rm();
	});

	it('imports the layout for a direct Markdown import', async () => {
		const { code } = await load(filePath);
		assert.match(code, /import Layout from "demo";/);
	});

	it('ignores the layout for a Markdown content collection entry', async () => {
		const { code } = await load(`${filePath}?astroMarkdownContentEntry`);
		assert.doesNotMatch(code, /import Layout/);
		assert.doesNotMatch(code, /renderComponent\(result, 'Layout'/);
	});
});
