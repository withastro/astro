export const TEMPLATES = [
	{
		title: 'Starter Kit (Generic)',
		value: 'starter',
		renderers: true,
	},
	{
		title: 'Blog',
		value: 'blog',
		renderers: ['@astrojs/renderer-preact'],
	},
	{
		title: 'Documentation',
		value: 'docs',
		renderers: ['@astrojs/renderer-preact'],
	},
	{
		title: 'Portfolio',
		value: 'portfolio',
		renderers: ['@astrojs/renderer-preact'],
	},
	{
		title: 'Portfolio Svelte',
		value: 'portfolio-svelte',
		renderers: ['@astrojs/renderer-svelte'],
	},
	{
		title: 'Minimal',
		value: 'minimal',
		renderers: [],
	},
];
