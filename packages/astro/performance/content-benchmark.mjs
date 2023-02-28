import { fileURLToPath } from 'url';
import { loadFixture } from '../test/test-utils.js';
import { generatePosts } from './scripts/generate-posts.mjs';
import yargs from 'yargs-parser';
import { cyan, bold, dim } from 'kleur/colors';

// Skip nonessential remark / rehype plugins for a fair comparison.
// This includes heading ID generation, syntax highlighting, GFM, and Smartypants.
process.env.ASTRO_PERFORMANCE_BENCHMARK = true;

const extByFixture = {
	md: '.md',
	mdx: '.mdx',
	mdoc: '.mdoc',
};

const NUM_POSTS = 1000;

async function benchmark({ fixtures, templates }) {
	for (const fixture of fixtures) {
		const root = new URL(`./fixtures/${fixture}/`, import.meta.url);
		await generatePosts({
			postsDir: fileURLToPath(new URL('./src/content/generated/', root)),
			numPosts: NUM_POSTS,
			ext: extByFixture[fixture],
			template: templates[fixture],
		});
		console.log(`[${fixture}] Generated posts`);

		const { build } = await loadFixture({
			root,
		});
		const now = performance.now();
		console.log(`[${fixture}] Building...`);
		await build();
		console.log(cyan(`[${fixture}] Built in ${bold(getTimeStat(now, performance.now()))}.`));
	}
}

// Test the build performance for content collections across multiple file types (md, mdx, mdoc)
(async function benchmarkAll() {
	try {
		const flags = yargs(process.argv.slice(2));
		const test = Array.isArray(flags.test)
			? flags.test
			: typeof flags.test === 'string'
			? [flags.test]
			: ['simple', 'with-astro-components', 'with-react-components'];

		if (test.includes('simple')) {
			console.log(`\n${bold('Simple')} ${dim(`${NUM_POSTS} posts (md, mdx, mdoc)`)}`);
			await benchmark({
				fixtures: ['md', 'mdx', 'mdoc'],
				templates: {
					md: 'simple.md',
					mdx: 'simple.md',
					mdoc: 'simple.md',
				},
			});
		}

		if (test.includes('with-astro-components')) {
			console.log(`\n${bold('With Astro components')} ${dim(`${NUM_POSTS} posts (mdx, mdoc)`)}`);
			await benchmark({
				fixtures: ['mdx', 'mdoc'],
				templates: {
					mdx: 'with-astro-components.mdx',
					mdoc: 'with-astro-components.mdoc',
				},
			});
		}

		if (test.includes('with-react-components')) {
			console.log(`\n${bold('With React components')} ${dim(`${NUM_POSTS} posts (mdx, mdoc)`)}`);
			await benchmark({
				fixtures: ['mdx', 'mdoc'],
				templates: {
					mdx: 'with-react-components.mdx',
					mdoc: 'with-react-components.mdoc',
				},
			});
		}
	} finally {
		process.env.ASTRO_PERFORMANCE_BENCHMARK = false;
	}
})();

function getTimeStat(timeStart, timeEnd) {
	const buildTime = timeEnd - timeStart;
	return buildTime < 750 ? `${Math.round(buildTime)}ms` : `${(buildTime / 1000).toFixed(2)}s`;
}
