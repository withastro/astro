import { prepareTestFactory } from './shared-component-tests.js';

const { test, createTests } = prepareTestFactory({ root: './fixtures/vue-component/' });

test.describe('Vue components in Astro files', () => {
	createTests({
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
		componentFilePath: './src/components/VueComponent.vue',
		counterCssFilePath: './src/components/Counter.vue',
	});
});

test.describe('Vue components in Markdown files', () => {
	createTests({
		pageUrl: '/markdown/',
		pageSourceFilePath: './src/pages/markdown.md',
		componentFilePath: './src/components/VueComponent.vue',
		counterCssFilePath: './src/components/Counter.vue',
	});
});

test.describe('Vue components in MDX files', () => {
	createTests({
		pageUrl: '/mdx/',
		pageSourceFilePath: './src/pages/mdx.mdx',
		componentFilePath: './src/components/VueComponent.vue',
		counterCssFilePath: './src/components/Counter.vue',
	});
});
