import { encryptString } from '../../../core/encryption.js';
import type { SSRResult } from '../../../types/public/internal.js';
import { markHTMLString } from '../escape.js';
import { renderChild } from './any.js';
import type { RenderInstance } from './common.js';
import { createRenderInstruction } from './instruction.js';
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

const SCRIPT_RE = /<\/script/giu;
const COMMENT_RE = /<!--/gu;
const SCRIPT_REPLACER = '<\\/script';
const COMMENT_REPLACER = '\\u003C!--';

/**
 * Encodes the script end-tag open (ETAGO) delimiter and opening HTML comment syntax for JSON inside a `<script>` tag.
 * @see https://mathiasbynens.be/notes/etago
 */
function safeJsonStringify(obj: any) {
	return JSON.stringify(obj)
		.replace(SCRIPT_RE, SCRIPT_REPLACER)
		.replace(COMMENT_RE, COMMENT_REPLACER);
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
			destination.write(createRenderInstruction({ type: 'server-island-runtime' }));

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
			const propsEncrypted =
				Object.keys(props).length === 0 ? '' : await encryptString(key, JSON.stringify(props));

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

			destination.write(`<script type="module" data-astro-rerun data-island-id="${hostId}">${
				useGETRequest
					? // GET request
						`let response = await fetch('${serverIslandUrl}');`
					: // POST request
						`let data = {
	componentExport: ${safeJsonStringify(componentExport)},
	encryptedProps: ${safeJsonStringify(propsEncrypted)},
	slots: ${safeJsonStringify(renderedSlots)},
};
let response = await fetch('${serverIslandUrl}', {
	method: 'POST',
	body: JSON.stringify(data),
});`
			}
replaceServerIsland('${hostId}', response);</script>`);
		},
	};
}

export const renderServerIslandRuntime = () =>
	markHTMLString(
		`
	<script>
		async function replaceServerIsland(id, r) {
			let s = document.querySelector(\`script[data-island-id="\${id}"]\`);
			// If there's no matching script, or the request fails then return
			if (!s || r.status !== 200 || r.headers.get('content-type')?.split(';')[0].trim() !== 'text/html') return;
			// Load the HTML before modifying the DOM in case of errors
			let html = await r.text();
			// Remove any placeholder content before the island script
			while (s.previousSibling && s.previousSibling.nodeType !== 8 && s.previousSibling.data !== '[if astro]>server-island-start<![endif]')
				s.previousSibling.remove();
			s.previousSibling?.remove();
			// Insert the new HTML
			s.before(document.createRange().createContextualFragment(html));
			// Remove the script. Prior to v5.4.2, this was the trick to force rerun of scripts.  Keeping it to minimize change to the existing behavior.
			s.remove();
		}
	</script>`
			// Very basic minification
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith('//'))
			.join(' '),
	);
