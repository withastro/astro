/** @type {import("prettier").Config} */
export default {
	printWidth: 100,
	semi: true,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'all',
	useTabs: true,
	overrides: [
		{
			files: ['*.md', '*.toml', '*.yml'],
			options: {
				useTabs: false,
			},
		},
	],
};
