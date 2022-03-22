import { IPseudoClassData } from 'vscode-css-languageservice';

export const pseudoClass: IPseudoClassData[] = [
	{
		name: ':global()',
		description: `[astro] :global modifier
Apply styles to a selector globally`,
		references: [
			{
				name: 'Astro documentation',
				url: 'https://docs.astro.build/en/guides/styling/#global-styles-within-style-tag',
			},
		],
	},
];
