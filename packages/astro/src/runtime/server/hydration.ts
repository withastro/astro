import type {
	AstroComponentMetadata,
	SSRElement,
	SSRLoadedRenderer,
	SSRResult,
} from '../../@types/astro';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { escapeHTML } from './escape.js';
import { serializeProps } from './serialize.js';
import { serializeListValue } from './util.js';

export interface HydrationMetadata {
	directive: string;
	value: string;
	componentUrl: string;
	componentExport: { value: string };
}

interface ExtractedProps {
	isPage: boolean;
	hydration: HydrationMetadata | null;
	props: Record<string | number | symbol, any>;
}

// Used to extract the directives, aka `client:load` information about a component.
// Finds these special props and removes them from what gets passed into the component.
export function extractDirectives(
	inputProps: Record<string | number | symbol, any>,
	clientDirectives: SSRResult['clientDirectives']
): ExtractedProps {
	let extracted: ExtractedProps = {
		isPage: false,
		hydration: null,
		props: {},
	};
	for (const [key, value] of Object.entries(inputProps)) {
		if (key.startsWith('server:')) {
			if (key === 'server:root') {
				extracted.isPage = true;
			}
		}
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
				case 'client:display-name': {
					break;
				}
				default: {
					extracted.hydration.directive = key.split(':')[1];
					extracted.hydration.value = value;

					// throw an error if an invalid hydration directive was provided
					if (!clientDirectives.has(extracted.hydration.directive)) {
						const hydrationMethods = Array.from(clientDirectives.keys())
							.map((d) => `client:${d}`)
							.join(', ');
						throw new Error(
							`Error: invalid hydration directive "${key}". Supported hydration methods: ${hydrationMethods}`
						);
					}

					// throw an error if the query wasn't provided for client:media
					if (
						extracted.hydration.directive === 'media' &&
						typeof extracted.hydration.value !== 'string'
					) {
						throw new AstroError(AstroErrorData.MissingMediaQueryDirective);
					}

					break;
				}
			}
		} else if (key === 'class:list') {
			if (value) {
				// support "class" from an expression passed into a component (#782)
				extracted.props[key.slice(0, -5)] = serializeListValue(value);
			}
		} else {
			extracted.props[key] = value;
		}
	}
	for (const sym of Object.getOwnPropertySymbols(inputProps)) {
		extracted.props[sym] = inputProps[sym];
	}

	return extracted;
}

interface HydrateScriptOptions {
	renderer: SSRLoadedRenderer;
	result: SSRResult;
	astroId: string;
	props: Record<string | number, any>;
	attrs: Record<string, string> | undefined;
}

/** For hydrated components, generate a <script type="module"> to load the component */
export async function generateHydrateScript(
	scriptOptions: HydrateScriptOptions,
	metadata: Required<AstroComponentMetadata>
): Promise<SSRElement> {
	const { renderer, result, astroId, props, attrs } = scriptOptions;
	const { hydrate, componentUrl, componentExport } = metadata;

	if (!componentExport.value) {
		throw new Error(
			`Unable to resolve a valid export for "${metadata.displayName}"! Please open an issue at https://astro.build/issues!`
		);
	}

	const island: SSRElement = {
		children: '',
		props: {
			// This is for HMR, probably can avoid it in prod
			uid: astroId,
		},
	};

	// Attach renderer-provided attributes
	if (attrs) {
		for (const [key, value] of Object.entries(attrs)) {
			island.props[key] = escapeHTML(value);
		}
	}

	// Add component url
	island.props['component-url'] = await result.resolve(decodeURI(componentUrl));

	// Add renderer url
	if (renderer.clientEntrypoint) {
		island.props['component-export'] = componentExport.value;
		island.props['renderer-url'] = await result.resolve(decodeURI(renderer.clientEntrypoint));
		island.props['props'] = escapeHTML(serializeProps(props, metadata));
	}

	island.props['ssr'] = '';
	island.props['client'] = hydrate;
	let beforeHydrationUrl = await result.resolve('astro:scripts/before-hydration.js');
	if (beforeHydrationUrl.length) {
		island.props['before-hydration-url'] = beforeHydrationUrl;
	}
	island.props['opts'] = escapeHTML(
		JSON.stringify({
			name: metadata.displayName,
			value: metadata.hydrateArgs || '',
		})
	);

	return island;
}
