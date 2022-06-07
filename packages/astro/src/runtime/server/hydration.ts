import serializeJavaScript from 'serialize-javascript';
import type {
	AstroComponentMetadata,
	SSRElement,
	SSRLoadedRenderer,
	SSRResult,
} from '../../@types/astro';
import { hydrationSpecifier, serializeListValue } from './util.js';

// Serializes props passed into a component so that they can be reused during hydration.
// The value is any
export function serializeProps(value: any) {
	return serializeJavaScript(value);
}

const HydrationDirectives = ['load', 'idle', 'media', 'visible', 'only'];

interface ExtractedProps {
	hydration: {
		directive: string;
		value: string;
		componentUrl: string;
		componentExport: { value: string };
	} | null;
	props: Record<string | number, any>;
}

// Used to extract the directives, aka `client:load` information about a component.
// Finds these special props and removes them from what gets passed into the component.
export function extractDirectives(inputProps: Record<string | number, any>): ExtractedProps {
	let extracted: ExtractedProps = {
		hydration: null,
		props: {},
	};
	for (const [key, value] of Object.entries(inputProps)) {
		if (key.startsWith('client:')) {
			if (!extracted.hydration) {
				extracted.hydration = {
					directive: '',
					value: '',
					componentUrl: '',
					componentExport: { value: '' },
				};
			}
			switch (key) {
				case 'client:component-path': {
					extracted.hydration.componentUrl = value;
					break;
				}
				case 'client:component-export': {
					extracted.hydration.componentExport.value = value;
					break;
				}
				// This is a special prop added to prove that the client hydration method
				// was added statically.
				case 'client:component-hydration': {
					break;
				}
				default: {
					extracted.hydration.directive = key.split(':')[1];
					extracted.hydration.value = value;

					// throw an error if an invalid hydration directive was provided
					if (HydrationDirectives.indexOf(extracted.hydration.directive) < 0) {
						throw new Error(
							`Error: invalid hydration directive "${key}". Supported hydration methods: ${HydrationDirectives.map(
								(d) => `"client:${d}"`
							).join(', ')}`
						);
					}

					// throw an error if the query wasn't provided for client:media
					if (
						extracted.hydration.directive === 'media' &&
						typeof extracted.hydration.value !== 'string'
					) {
						throw new Error(
							'Error: Media query must be provided for "client:media", similar to client:media="(max-width: 600px)"'
						);
					}

					break;
				}
			}
		} else if (key === 'class:list') {
			// support "class" from an expression passed into a component (#782)
			extracted.props[key.slice(0, -5)] = serializeListValue(value);
		} else {
			extracted.props[key] = value;
		}
	}

	return extracted;
}

interface HydrateScriptOptions {
	renderer: SSRLoadedRenderer;
	result: SSRResult;
	astroId: string;
	props: Record<string | number, any>;
}

/** For hydrated components, generate a <script type="module"> to load the component */
export async function generateHydrateScript(
	scriptOptions: HydrateScriptOptions,
	metadata: Required<AstroComponentMetadata>
): Promise<SSRElement> {
	const { renderer, result, astroId, props } = scriptOptions;
	const { hydrate, componentUrl, componentExport } = metadata;

	if (!componentExport) {
		throw new Error(
			`Unable to resolve a componentExport for "${metadata.displayName}"! Please open an issue.`
		);
	}

	const hydrationSource = renderer.clientEntrypoint
		? `const [{ ${
				componentExport.value
		  }: Component }, { default: hydrate }] = await Promise.all([import("${await result.resolve(
				componentUrl
		  )}"), import("${await result.resolve(renderer.clientEntrypoint)}")]);
  return (el, children) => hydrate(el)(Component, ${serializeProps(
		props
	)}, children, ${JSON.stringify({ client: hydrate })});
`
		: `await import("${await result.resolve(componentUrl)}");
  return () => {};
`;
	// TODO: If we can figure out tree-shaking in the final SSR build, we could safely
	// use BEFORE_HYDRATION_SCRIPT_ID instead of 'astro:scripts/before-hydration.js'.
	const hydrationScript = {
		props: { type: 'module', 'data-astro-component-hydration': true },
		children: `import setup from '${await result.resolve(hydrationSpecifier(hydrate))}';
${`import '${await result.resolve('astro:scripts/before-hydration.js')}';`}
setup("${astroId}", {name:"${metadata.displayName}",${
			metadata.hydrateArgs ? `value: ${JSON.stringify(metadata.hydrateArgs)}` : ''
		}}, async () => {
  ${hydrationSource}
});
`,
	};

	return hydrationScript;
}
