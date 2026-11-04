import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Create an independent project outside every other fixture's file watcher. */
export async function createContentStartupFixture() {
	const root = await mkdtemp(path.join(tmpdir(), 'astro-content-startup-'));
	try {
		await mkdir(path.join(root, 'node_modules'));
		// Match a workspace dependency without sharing any fixture's files or cache.
		await symlink(
			fileURLToPath(new URL('../', import.meta.url)),
			path.join(root, 'node_modules/astro'),
			'junction',
		);
		await mkdir(path.join(root, 'src/content/blog'), { recursive: true });
		await mkdir(path.join(root, 'src/pages'), { recursive: true });
		await writeFile(path.join(root, 'package.json'), JSON.stringify({ type: 'module' }));
		await writeFile(
			path.join(root, 'astro.config.mjs'),
			'export default { devToolbar: { enabled: false } };',
		);
		await writeFile(
			path.join(root, 'src/content.config.ts'),
			`
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
export const collections = { blog: defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({ title: z.string() }),
}) };
`,
		);
		await writeFile(
			path.join(root, 'src/content/blog/hello.md'),
			'---\ntitle: Original title\n---\nHello!\n',
		);
		await writeFile(
			path.join(root, 'src/pages/index.astro'),
			`---
import { getCollection } from 'astro:content';
const entries = await getCollection('blog');
---
<html><body>{entries.map(entry => <h2>{entry.data.title}</h2>)}</body></html>
`,
		);
		return root;
	} catch (error) {
		await rm(root, { recursive: true, force: true });
		throw error;
	}
}
