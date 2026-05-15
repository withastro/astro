import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { escapeHTML } from './escape.js';
import { serializeProps } from './serialize.js';
const transitionDirectivesToCopyOnIsland = Object.freeze([
	'data-astro-transition-scope',
	'data-astro-transition-persist',
	'data-astro-transition-persist-props',
]);
function extractDirectives(inputProps, clientDirectives) {
	let extracted = {
		isPage: false,
		hydration: null,
		props: {},
		propsWithoutTransitionAttributes: {},
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
					if (!clientDirectives.has(extracted.hydration.directive)) {
						const hydrationMethods = Array.from(clientDirectives.keys())
							.map((d) => `client:${d}`)
							.join(', ');
						throw new Error(
							`Error: invalid hydration directive "${key}". Supported hydration methods: ${hydrationMethods}`,
						);
					}
					if (
						extracted.hydration.directive === 'media' &&
						typeof extracted.hydration.value !== 'string'
					) {
						throw new AstroError(AstroErrorData.MissingMediaQueryDirective);
					}
					break;
				}
			}
		} else {
			extracted.props[key] = value;
			if (!transitionDirectivesToCopyOnIsland.includes(key)) {
				extracted.propsWithoutTransitionAttributes[key] = value;
			}
		}
	}
	for (const sym of Object.getOwnPropertySymbols(inputProps)) {
		extracted.props[sym] = inputProps[sym];
		extracted.propsWithoutTransitionAttributes[sym] = inputProps[sym];
	}
	return extracted;
}
async function generateHydrateScript(scriptOptions, metadata) {
	const { renderer, result, astroId, props, attrs } = scriptOptions;
	const { hydrate, componentUrl, componentExport } = metadata;
	if (!componentExport.value) {
		throw new AstroError({
			...AstroErrorData.NoMatchingImport,
			message: AstroErrorData.NoMatchingImport.message(metadata.displayName),
		});
	}
	const island = {
		children: '',
		props: {
			// This is for HMR, probably can avoid it in prod
			uid: astroId,
		},
	};
	if (attrs) {
		for (const [key, value] of Object.entries(attrs)) {
			island.props[key] = escapeHTML(value);
		}
	}
	island.props['component-url'] = await result.resolve(decodeURI(componentUrl));
	if (renderer.clientEntrypoint) {
		island.props['component-export'] = componentExport.value;
		island.props['renderer-url'] = await result.resolve(
			decodeURI(renderer.clientEntrypoint.toString()),
		);
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
		}),
	);
	transitionDirectivesToCopyOnIsland.forEach((name) => {
		if (typeof props[name] !== 'undefined') {
			island.props[name] = props[name];
		}
	});
	return island;
}
export { extractDirectives, generateHydrateScript };
