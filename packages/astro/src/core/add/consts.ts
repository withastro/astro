export const FIRST_PARTY_FRAMEWORKS = [
	{ value: 'react', title: 'React' },
	{ value: 'preact', title: 'Preact' },
	{ value: 'vue', title: 'Vue' },
	{ value: 'svelte', title: 'Svelte' },
	{ value: 'solid-js', title: 'Solid' },
	{ value: 'lit', title: 'Lit' },
];
export const FIRST_PARTY_ADDONS = [
	{ value: 'tailwind', title: 'Tailwind' },
	{ value: 'turbolinks', title: 'Turbolinks' },
	{ value: 'partytown', title: 'Partytown' },
	{ value: 'sitemap', title: 'Sitemap' },
];
export const ALIASES = new Map([
	['solid', 'solid-js'],
	['tailwindcss', 'tailwind'],
]);
export const CONFIG_STUB = `import { defineConfig } from 'astro/config';\n\nexport default defineConfig({});`;
export const TAILWIND_CONFIG_STUB = `module.exports = {
	content: [],
	theme: {
		extend: {},
	},
	plugins: [],
}\n`;
