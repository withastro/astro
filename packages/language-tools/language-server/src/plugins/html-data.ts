import { getDefaultHTMLDataProvider, newHTMLDataProvider } from 'vscode-html-languageservice';

const defaultProvider = getDefaultHTMLDataProvider();
const slotAttr = defaultProvider.provideAttributes('div').find((attr) => attr.name === 'slot')!;

export const classListAttribute = newHTMLDataProvider('class-list', {
	version: 1,
	globalAttributes: [
		{
			name: 'class:list',
			description:
				'Utility to provide a list of classes of the element. Takes an array of class values and converts them into a class string.',
			references: [
				{
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/reference/directives-reference/#classlist',
				},
			],
		},
	],
});

export const astroElements = newHTMLDataProvider('astro-elements', {
	version: 1,
	tags: [
		{
			name: 'slot',
			description:
				'The slot element is a placeholder for external HTML content, allowing you to inject (or “slot”) child elements from other files into your component template.',
			references: [
				{
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/basics/astro-components/#slots',
				},
			],
			attributes: [
				{
					name: 'name',
					description:
						'The name attribute allows you to pass only HTML elements with the corresponding slot name into a slot’s location.',
					references: [
						{
							name: 'Astro reference',
							url: 'https://docs.astro.build/en/basics/astro-components/#named-slots',
						},
					],
				},
			],
		},
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
					description:
						'Passes serializable server-side variables into a client-side script element.',
					references: [
						{
							name: 'Astro reference',
							url: 'https://docs.astro.build/en/reference/directives-reference/#definevars',
						},
					],
				},
				{
					name: 'hoist',
					description:
						'**Deprecated in Astro >= 0.26.0**\n\nBuilds, optimizes, and bundles your script with the other JavaScript on the page.',
					valueSet: 'v',
					references: [
						{
							name: 'Astro reference',
							url: 'https://docs.astro.build/en/core-concepts/astro-components/#using-hoisted-scripts',
						},
					],
				},
				{
					name: 'is:inline',
					description:
						'Leave a script tag inline in the page template. No processing will be done on its content.',
					valueSet: 'v',
					references: [
						{
							name: 'Astro reference',
							url: 'https://docs.astro.build/en/reference/directives-reference/#isinline',
						},
					],
				},
				{
					name: 'data-astro-rerun',
					description:
						'Force a script to be reexecuted when using <ViewTransitions/>. This will make your script is:inline as well.',
					valueSet: 'v',
					references: [
						{
							name: 'Astro reference',
							url: 'https://docs.astro.build/en/guides/view-transitions/#data-astro-rerun',
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
					description:
						'Passes serializable server-side variables into a client-side style element.',
					references: [
						{
							name: 'Astro reference',
							url: 'https://docs.astro.build/en/reference/directives-reference/#definevars',
						},
					],
				},
				{
					name: 'global',
					description:
						'**Deprecated in favor of `is:global` in >= Astro 0.26.0**\n\nOpts-out of automatic CSS scoping, all contents will be available globally.',
					valueSet: 'v',
					references: [
						{
							name: 'Astro reference',
							url: 'https://docs.astro.build/en/reference/directives-reference/#isglobal',
						},
					],
				},
				{
					name: 'is:global',
					description:
						'Opts-out of automatic CSS scoping, all contents will be available globally.',
					valueSet: 'v',
					references: [
						{
							name: 'Astro reference',
							url: 'https://docs.astro.build/en/reference/directives-reference/#isglobal',
						},
					],
				},
				{
					name: 'is:inline',
					description:
						'Leave a style tag inline in the page template. No processing will be done on its content.',
					valueSet: 'v',
					references: [
						{
							name: 'Astro reference',
							url: 'https://docs.astro.build/en/reference/directives-reference/#isinline',
						},
					],
				},
			],
		},
	],
});

export const astroAttributes = newHTMLDataProvider('astro-attributes', {
	version: 1,
	globalAttributes: [
		{
			name: 'set:html',
			description: 'Inject unescaped HTML into this tag.',
			references: [
				{
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/reference/directives-reference/#sethtml',
				},
			],
		},
		{
			name: 'set:text',
			description: 'Inject escaped text into this tag.',
			references: [
				{
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/reference/directives-reference/#settext',
				},
			],
		},
		{
			name: 'is:raw',
			description: 'Instructs the Astro compiler to treat any children of this element as text.',
			valueSet: 'v',
			references: [
				{
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/reference/directives-reference/#israw',
				},
			],
		},
		{
			name: 'transition:animate',
			description: 'Specifies an animation to use with this element on page transition.',
			references: [
				{
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/guides/view-transitions/#transition-directives',
				},
			],
		},
		{
			name: 'transition:name',
			description:
				'Specifies a `view-transition-name` for this element. The name must be unique on the page.',
			references: [
				{
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/guides/view-transitions/#transition-directives',
				},
			],
		},
		{
			name: 'transition:persist',
			description: 'Marks this element to be moved to the next page during view transitions.',
			references: [
				{
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/guides/view-transitions/#transition-directives',
				},
			],
		},
		slotAttr,
	],
});

export const astroDirectives = newHTMLDataProvider('astro-directives', {
	version: 1,
	globalAttributes: [
		{
			name: 'client:load',
			description:
				'Start importing the component JS at page load. Hydrate the component when import completes.',
			valueSet: 'v',
			references: [
				{
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/reference/directives-reference/#clientload',
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
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/reference/directives-reference/#clientidle',
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
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/reference/directives-reference/#clientvisible',
				},
			],
		},
		{
			name: 'client:media',
			description:
				'Start importing the component JS as soon as the browser matches the given media query (uses matchMedia). Hydrate the component when import completes. Useful for sidebar toggles, or other elements that should only display on mobile or desktop devices.',
			references: [
				{
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/reference/directives-reference/#clientmedia',
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
					name: 'Astro reference',
					url: 'https://docs.astro.build/en/reference/directives-reference/#clientonly',
				},
			],
		},
	],
});
