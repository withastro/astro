import { fileURLToPath } from 'node:url';
import nodeFS from 'node:fs';
import path from 'node:path';
import slash from 'slash';

import { runInContainer } from '../../../dist/core/dev/index.js';
import { attachContentServerListeners } from '../../../dist/content/index.js';
import { createFs, triggerFSEvent } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

function getTypesDts() {
	const typesdtsURL = new URL('../../../src/content/template/types.d.ts', import.meta.url);
	const relpath = slash(path.relative(fileURLToPath(root), fileURLToPath(typesdtsURL)));
	return {
		[relpath]: nodeFS.readFileSync(typesdtsURL, 'utf-8'),
	};
}

describe('frontmatter', () => {
	it('errors in content/ does not crash server', async () => {
		const fs = createFs(
			{
				...getTypesDts(),
				'/src/content/posts/blog.md': `
					---
					title: One
					---
				`,
				'/src/content/config.ts': `
					import { defineCollection, z } from 'astro:content';

					const posts = defineCollection({
						schema: z.string()
					});

					export const collections = {
						posts
					};
				`,
				'/src/pages/index.astro': `
					---
					---
					<html>
						<head><title>Test</title></head>
						<body class="one">
							<h1>Test</h1>
						</body>
					</html>
				`,
			},
			root
		);

		await runInContainer({ fs, root }, async (container) => {
			await attachContentServerListeners(container);

			fs.writeFileFromRootSync(
				'/src/content/posts/blog.md',
				`
				---
				title: One
				title: two
				---
				`
			);
			triggerFSEvent(container, fs, '/src/content/posts/blog.md', 'change');
			await new Promise((resolve) => setTimeout(resolve, 100));
			// Note, if we got here, it didn't crash
		});
	});
});
