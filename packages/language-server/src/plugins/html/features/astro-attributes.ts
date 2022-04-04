import { newHTMLDataProvider } from 'vscode-html-languageservice';

export const classListAttribute = newHTMLDataProvider('class-list', {
	version: 1,
	globalAttributes: [
		{
			name: 'class:list',
			description: 'Utility to provide a list of class',
		},
	],
});

export const astroAttributes = newHTMLDataProvider('astro-attributes', {
	version: 1,
	globalAttributes: [
		{
			name: 'set:html',
			description: 'Inject unescaped HTML into this tag',
			references: [
				{
					name: 'Astro documentation',
					url: 'https://docs.astro.build/en/migrate/#deprecated-unescaped-html',
				},
			],
		},
		{
			name: 'set:text',
			description: 'Inject escaped text into this tag',
			references: [
				{
					name: 'Astro documentation',
					url: 'https://docs.astro.build/en/migrate/#deprecated-unescaped-html',
				},
			],
		},
	],
	tags: [
		{
			name: 'script',
			attributes: [
				{
					// The VS Code tag definitions does not provide a description for the deprecated `charset` attribute on script tags
					// Which mean that since we get no hover info for this, we instead get JSX hover info. So we'll just specify a description ourselves for this specific case
					name: 'charset',
					description:
						"**Deprecated**\n\nIt's unnecessary to specify the charset attribute, because documents must use UTF-8, and the script element inherits its character encoding from the document.",
				},
				{
					name: 'define:vars',
					description: 'Passes serializable server-side variables into a client-side script element',
					references: [
						{
							name: 'Astro documentation',
							url: 'https://docs.astro.build/en/guides/styling/#variables-in-scripts--styles',
						},
					],
				},
				{
					name: 'hoist',
					description:
						'**Deprecated in Astro >= 0.26.0**\n\nBuilds, optimizes, and bundles your script with the other JavaScript on the page',
					valueSet: 'v',
					references: [
						{
							name: 'Astro documentation',
							url: 'https://docs.astro.build/en/core-concepts/astro-components/#using-hoisted-scripts',
						},
					],
				},
				{
					name: 'is:inline',
					description: 'Leave a script tag inline in the page template. No processing will be done on its content',
					valueSet: 'v',
					references: [
						{
							name: 'Astro documentation',
							url: 'https://docs.astro.build/en/migrate/#new-default-script-behavior',
						},
					],
				},
			],
		},
		{
			name: 'style',
			attributes: [
				{
					name: 'define:vars',
					description: 'Passes serializable server-side variables into a client-side style element',
					references: [
						{
							name: 'Astro documentation',
							url: 'https://docs.astro.build/en/guides/styling/#variables-in-scripts--styles',
						},
					],
				},
				{
					name: 'global',
					description:
						'**Deprecated in favor of `is:global` in >= Astro 0.26.0**\n\nOpts-out of automatic CSS scoping, all contents will be available globally',
					valueSet: 'v',
					references: [
						{
							name: 'Astro documentation',
							url: 'https://docs.astro.build/en/guides/styling/#global-styles',
						},
					],
				},
				{
					name: 'is:global',
					description: 'Opts-out of automatic CSS scoping, all contents will be available globally',
					valueSet: 'v',
					references: [
						{
							name: 'Astro documentation',
							url: 'https://docs.astro.build/en/guides/styling/#global-styles',
						},
					],
				},
				{
					name: 'is:inline',
					description: 'Leave a style tag inline in the page template. No processing will be done on its content',
					valueSet: 'v',
					references: [
						{
							name: 'Astro documentation',
							url: 'https://docs.astro.build/en/migrate/#new-default-script-behavior',
						},
					],
				},
			],
		},
	],
});

export const astroDirectives = newHTMLDataProvider('astro-directives', {
	version: 1,
	globalAttributes: [
		{
			name: 'client:load',
			description: 'Start importing the component JS at page load. Hydrate the component when import completes.',
			valueSet: 'v',
			references: [
				{
					name: 'Astro documentation',
					url: 'https://docs.astro.build/en/core-concepts/component-hydration/#hydrate-interactive-components',
				},
			],
		},
		{
			name: 'client:idle',
			description:
				'Start importing the component JS as soon as main thread is free (uses requestIdleCallback()). Hydrate the component when import completes.',
			valueSet: 'v',
			references: [
				{
					name: 'Astro documentation',
					url: 'https://docs.astro.build/en/core-concepts/component-hydration/#hydrate-interactive-components',
				},
			],
		},
		{
			name: 'client:visible',
			description:
				'Start importing the component JS as soon as the element enters the viewport (uses IntersectionObserver). Hydrate the component when import completes. Useful for content lower down on the page.',
			valueSet: 'v',
			references: [
				{
					name: 'Astro documentation',
					url: 'https://docs.astro.build/en/core-concepts/component-hydration/#hydrate-interactive-components',
				},
			],
		},
		{
			name: 'client:media',
			description:
				'Start importing the component JS as soon as the browser matches the given media query (uses matchMedia). Hydrate the component when import completes. Useful for sidebar toggles, or other elements that should only display on mobile or desktop devices.',
			references: [
				{
					name: 'Astro documentation',
					url: 'https://docs.astro.build/en/core-concepts/component-hydration/#hydrate-interactive-components',
				},
			],
		},
		{
			name: 'client:only',
			description:
				'Start importing the component JS at page load and hydrate when the import completes, similar to client:load. The component will be skipped at build time, useful for components that are entirely dependent on client-side APIs. This is best avoided unless absolutely needed, in most cases it is best to render placeholder content on the server and delay any browser API calls until the component hydrates in the browser.',
			valueSet: 'v',
			references: [
				{
					name: 'Astro documentation',
					url: 'https://docs.astro.build/en/core-concepts/component-hydration/#hydrate-interactive-components',
				},
			],
		},
	],
});
