import { encryptString, generateCspDigest } from '../../../core/encryption.js';
import type { SSRResult } from '../../../types/public/internal.js';
import { markHTMLString } from '../escape.js';
import { renderChild } from './any.js';
import { createThinHead, type ThinHead } from './astro/head-and-content.js';
import type { RenderDestination } from './common.js';
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

export class ServerIslandComponent {
	result: SSRResult;
	props: Record<string | number, any>;
	slots: ComponentSlots;
	displayName: string;
	hostId: string | undefined;
	islandContent: string | undefined;
	componentPath: string | undefined;
	componentExport: string | undefined;
	componentId: string | undefined;
	constructor(
		result: SSRResult,
		props: Record<string | number, any>,
		slots: ComponentSlots,
		displayName: string,
	) {
		this.result = result;
		this.props = props;
		this.slots = slots;
		this.displayName = displayName;
	}

	async init(): Promise<ThinHead> {
		const content = await this.getIslandContent();

		if (this.result.cspDestination) {
			this.result._metadata.extraScriptHashes.push(
				await generateCspDigest(SERVER_ISLAND_REPLACER, this.result.cspAlgorithm),
			);
			const contentDigest = await generateCspDigest(content, this.result.cspAlgorithm);
			this.result._metadata.extraScriptHashes.push(contentDigest);
		}

		return createThinHead();
	}
	async render(destination: RenderDestination) {
		const hostId = await this.getHostId();
		const islandContent = await this.getIslandContent();
		destination.write(createRenderInstruction({ type: 'server-island-runtime' }));
		destination.write('<!--[if astro]>server-island-start<![endif]-->');
		// Render the slots
		for (const name in this.slots) {
			if (name === 'fallback') {
				await renderChild(destination, this.slots.fallback(this.result));
			}
		}
		destination.write(
			`<script type="module" data-astro-rerun data-island-id="${hostId}">${islandContent}</script>`,
		);
	}

	getComponentPath(): string {
		if (this.componentPath) {
			return this.componentPath;
		}
		const componentPath = this.props['server:component-path'];
		if (!componentPath) {
			throw new Error(`Could not find server component path`);
		}
		this.componentPath = componentPath;
		return componentPath;
	}

	getComponentExport(): string {
		if (this.componentExport) {
			return this.componentExport;
		}
		const componentExport = this.props['server:component-export'];
		if (!componentExport) {
			throw new Error(`Could not find server component export`);
		}
		this.componentExport = componentExport;
		return componentExport;
	}

	async getHostId() {
		if (!this.hostId) {
			this.hostId = await crypto.randomUUID();
		}
		return this.hostId;
	}

	async getIslandContent() {
		if (this.islandContent) {
			return this.islandContent;
		}

		const componentPath = this.getComponentPath();
		const componentExport = this.getComponentExport();
		const componentId = this.result.serverIslandNameMap.get(componentPath);

		if (!componentId) {
			throw new Error(`Could not find server component name`);
		}

		// Remove internal props
		for (const key of Object.keys(this.props)) {
			if (internalProps.has(key)) {
				delete this.props[key];
			}
		}

		// Render the slots
		const renderedSlots: Record<string, string> = {};
		for (const name in this.slots) {
			if (name !== 'fallback') {
				const content = await renderSlotToString(this.result, this.slots[name]);
				renderedSlots[name] = content.toString();
			}
		}

		const key = await this.result.key;
		const propsEncrypted =
			Object.keys(this.props).length === 0
				? ''
				: await encryptString(key, JSON.stringify(this.props));

		const hostId = await this.getHostId();
		const slash = this.result.base.endsWith('/') ? '' : '/';
		let serverIslandUrl = `${this.result.base}${slash}_server-islands/${componentId}${this.result.trailingSlash === 'always' ? '/' : ''}`;

		// Determine if its safe to use a GET request
		const potentialSearchParams = createSearchParams(
			componentExport,
			propsEncrypted,
			safeJsonStringify(renderedSlots),
		);
		const useGETRequest = isWithinURLLimit(serverIslandUrl, potentialSearchParams);

		if (useGETRequest) {
			serverIslandUrl += '?' + potentialSearchParams.toString();
			this.result._metadata.extraHead.push(
				markHTMLString(
					`<link rel="preload" as="fetch" href="${serverIslandUrl}" crossorigin="anonymous">`,
				),
			);
		}

		// Get adapter headers for inline script
		const adapterHeaders = this.result.internalFetchHeaders || {};
		const headersJson = safeJsonStringify(adapterHeaders);

		const method = useGETRequest
			? // GET request
				`const headers = new Headers(${headersJson});
let response = await fetch('${serverIslandUrl}', { headers });`
			: // POST request
				`let data = {
	componentExport: ${safeJsonStringify(componentExport)},
	encryptedProps: ${safeJsonStringify(propsEncrypted)},
	slots: ${safeJsonStringify(renderedSlots)},
};
const headers = new Headers({ 'Content-Type': 'application/json', ...${headersJson} });
let response = await fetch('${serverIslandUrl}', {
	method: 'POST',
	body: JSON.stringify(data),
	headers,
});`;

		this.islandContent = `${method}replaceServerIsland('${hostId}', response);`;
		return this.islandContent;
	}
}

export const renderServerIslandRuntime = () => {
	return `<script>${SERVER_ISLAND_REPLACER}</script>`;
};

const SERVER_ISLAND_REPLACER = markHTMLString(
	`async function replaceServerIsland(id, r) {
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
}` // Very basic minification
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('//'))
		.join(' '),
);
