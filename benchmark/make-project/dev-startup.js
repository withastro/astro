import fs from 'node:fs/promises';
import { loremIpsum } from './_util.js';

// A small but representative project for the dev startup benchmark: a handful
// of pages, one shared component, and a content collection with a content
// config. The content config load and the dev server app module graph are the
// two startup costs the benchmark is meant to track, so the fixture exercises
// both.

/**
 * @param {URL} projectDir
 */
export async function run(projectDir) {
	await fs.rm(projectDir, { recursive: true, force: true });
	await fs.mkdir(new URL('./src/pages/blog', projectDir), { recursive: true });
	await fs.mkdir(new URL('./src/components', projectDir), { recursive: true });
	await fs.mkdir(new URL('./src/content/blog', projectDir), { recursive: true });

	const promises = [];

	for (const name of ['index', 'about', 'contact']) {
		promises.push(
			fs.writeFile(
				new URL(`./src/pages/${name}.astro`, projectDir),
				`\
---
import Layout from '../components/Layout.astro';
---
<Layout title="${name}">
	<h1>${name}</h1>
	<p>${loremIpsum}</p>
</Layout>`,
				'utf-8',
			),
		);
	}

	promises.push(
		fs.writeFile(
			new URL('./src/pages/blog/index.astro', projectDir),
			`\
---
import Layout from '../../components/Layout.astro';
import { getCollection } from 'astro:content';
const posts = await getCollection('blog');
---
<Layout title="Blog">
	<h1>Blog</h1>
	<ul>
		{posts.map((post) => <li><a href={post.id}>{post.data.title}</a></li>)}
	</ul>
</Layout>`,
			'utf-8',
		),
	);

	promises.push(
		fs.writeFile(
			new URL('./src/pages/blog/[slug].astro', projectDir),
			`\
---
import Layout from '../../components/Layout.astro';
import { getCollection, render } from 'astro:content';
export async function getStaticPaths() {
	const posts = await getCollection('blog');
	return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}
const { post } = Astro.props;
const { Content } = await render(post);
---
<Layout title={post.data.title}>
	<h1>{post.data.title}</h1>
	<Content />
</Layout>`,
			'utf-8',
		),
	);

	promises.push(
		fs.writeFile(
			new URL('./src/components/Layout.astro', projectDir),
			`---
const { title } = Astro.props;
---
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<title>{title}</title>
	</head>
	<body>
		<slot />
	</body>
</html>`,
			'utf-8',
		),
	);

	for (let i = 0; i < 20; i++) {
		promises.push(
			fs.writeFile(
				new URL(`./src/content/blog/post-${i}.md`, projectDir),
				`\
---
title: Post ${i}
---

# Post ${i}

${loremIpsum}
`,
				'utf-8',
			),
		);
	}

	await fs.writeFile(
		new URL('./src/content.config.ts', projectDir),
		`\
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
	}),
});

export const collections = { blog };
`,
		'utf-8',
	);

	await fs.writeFile(
		new URL('./astro.config.js', projectDir),
		`\
import { defineConfig } from 'astro/config';

export default defineConfig({});`,
		'utf-8',
	);

	await Promise.all(promises);
}
