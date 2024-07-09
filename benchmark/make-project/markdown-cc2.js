import fs from 'node:fs/promises';
import { loremIpsumMd } from './_util.js';

/**
 * @param {URL} projectDir
 */
export async function run(projectDir) {
	await fs.rm(projectDir, { recursive: true, force: true });
	await fs.mkdir(new URL('./src/pages/blog', projectDir), { recursive: true });
	await fs.mkdir(new URL('./data/blog', projectDir), { recursive: true });
	await fs.mkdir(new URL('./src/content', projectDir), { recursive: true });

	const promises = [];

	for (let i = 0; i < 10000; i++) {
		const content = `\
# Article ${i}

${loremIpsumMd}
`;
		promises.push(
			fs.writeFile(new URL(`./data/blog/article-${i}.md`, projectDir), content, 'utf-8')
		);
	}

	await fs.writeFile(
		new URL(`./src/content/config.ts`, projectDir),
		/*ts */ `
		import { defineCollection, z } from 'astro:content';
		import { glob } from 'astro/loaders';

		const blog = defineCollection({
			type: 'experimental_data',
			loader: glob({ pattern: '*', base: './data/blog' }),
		});
		
		export const collections = { blog }

		`
	);

	await fs.writeFile(
		new URL(`./src/pages/blog/[...slug].astro`, projectDir),
		`\
---
import { getCollection } from 'astro:content';
export async function getStaticPaths() {
  const blogEntries = await getCollection('blog');
  return blogEntries.map(entry => ({
    params: { slug: entry.id }, props: { entry },
  }));
}
const { entry } = Astro.props;
const { Content } = await entry.render();

---
<h1>{entry.data.title}</h1>
<Content />
`,
		'utf-8'
	);

	await Promise.all(promises);

	await fs.writeFile(
		new URL('./astro.config.js', projectDir),
		`\
import { defineConfig } from 'astro/config';

export default defineConfig({
});`,
		'utf-8'
	);
}
