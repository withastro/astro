import { encryptString } from '../../../core/encryption.js';
import type { SSRResult } from '../../../types/public/internal.js';
import { renderChild } from './any.js';
import type { RenderInstance } from './common.js';
import { type ComponentSlots, renderSlotToString } from './slot.js';

const internalProps = new Set([
	'server:component-path',
	'server:component-export',
	'server:component-directive',
	'server:defer',
]);

export function containsServerDirective(props: Record<string | number, any>) {
	return 'server:component-directive' in props;
}

function safeJsonStringify(obj: any) {
	return JSON.stringify(obj)
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029')
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/\//g, '\\u002f');
}

function createSearchParams(componentExport: string, encryptedProps: string, slots: string) {
	const params = new URLSearchParams();
	params.set('e', componentExport);
	params.set('p', encryptedProps);
	params.set('s', slots);
	return params;
}

function isWithinURLLimit(pathname: string, params: URLSearchParams) {
	const url = pathname + '?' + params.toString();
	const chars = url.length;
	// https://chromium.googlesource.com/chromium/src/+/master/docs/security/url_display_guidelines/url_display_guidelines.md#url-length
	return chars < 2048;
}

export function renderServerIsland(
	result: SSRResult,
	_displayName: string,
	props: Record<string | number, any>,
	slots: ComponentSlots,
): RenderInstance {
	return {
		async render(destination) {
			const componentPath = props['server:component-path'];
			const componentExport = props['server:component-export'];
			const componentId = result.serverIslandNameMap.get(componentPath);

			if (!componentId) {
				throw new Error(`Could not find server component name`);
			}

			// Remove internal props
			for (const key of Object.keys(props)) {
				if (internalProps.has(key)) {
					delete props[key];
				}
			}

			destination.write('<!--[if astro]>server-island-start<![endif]-->');

			// Render the slots
			const renderedSlots: Record<string, string> = {};
			for (const name in slots) {
				if (name !== 'fallback') {
					const content = await renderSlotToString(result, slots[name]);
					renderedSlots[name] = content.toString();
				} else {
					await renderChild(destination, slots.fallback(result));
				}
			}

			const key = await result.key;
			const propsEncrypted = await encryptString(key, JSON.stringify(props));

			const hostId = crypto.randomUUID();

			const slash = result.base.endsWith('/') ? '' : '/';
			let serverIslandUrl = `${result.base}${slash}_server-islands/${componentId}${result.trailingSlash === 'always' ? '/' : ''}`;

			// Determine if its safe to use a GET request
			const potentialSearchParams = createSearchParams(
				componentExport,
				propsEncrypted,
				safeJsonStringify(renderedSlots),
			);
			const useGETRequest = isWithinURLLimit(serverIslandUrl, potentialSearchParams);

			if (useGETRequest) {
				serverIslandUrl += '?' + potentialSearchParams.toString();
				destination.write(
					`<link rel="preload" as="fetch" href="${serverIslandUrl}" crossorigin="anonymous">`,
				);
			}

			destination.write(`<script async type="module" data-island-id="${hostId}">
let script = document.querySelector('script[data-island-id="${hostId}"]');

${
	useGETRequest
		? // GET request
			`let response = await fetch('${serverIslandUrl}');
`
		: // POST request
			`let data = {
	componentExport: ${safeJsonStringify(componentExport)},
	encryptedProps: ${safeJsonStringify(propsEncrypted)},
	slots: ${safeJsonStringify(renderedSlots)},
};

let response = await fetch('${serverIslandUrl}', {
	method: 'POST',
	body: JSON.stringify(data),
});
`
}

if(response.status === 200 && response.headers.get('content-type') === 'text/html') {
	let html = await response.text();

	// Swap!
	while(script.previousSibling &&
		script.previousSibling.nodeType !== 8 &&
		script.previousSibling.data !== '[if astro]>server-island-start<![endif]') {
		script.previousSibling.remove();
	}
	script.previousSibling?.remove();

	let frag = document.createRange().createContextualFragment(html);
	script.before(frag);
}
script.remove();
</script>`);
		},
	};
}
