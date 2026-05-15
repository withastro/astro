import { encryptString, generateCspDigest } from '../../../core/encryption.js';
import { markHTMLString, stringifyForScript } from '../escape.js';
import { renderChild } from './any.js';
import { createThinHead } from './astro/head-and-content.js';
import { createRenderInstruction } from './instruction.js';
import { renderSlotToString } from './slot.js';
const internalProps = /* @__PURE__ */ new Set([
	'server:component-path',
	'server:component-export',
	'server:component-directive',
	'server:defer',
]);
function containsServerDirective(props) {
	return 'server:component-directive' in props;
}
function createSearchParams(encryptedComponentExport, encryptedProps, slots) {
	const params = new URLSearchParams();
	params.set('e', encryptedComponentExport);
	params.set('p', encryptedProps);
	params.set('s', slots);
	return params;
}
function isWithinURLLimit(pathname, params) {
	const url = pathname + '?' + params.toString();
	const chars = url.length;
	return chars < 2048;
}
class ServerIslandComponent {
	result;
	props;
	slots;
	displayName;
	hostId;
	islandContent;
	componentPath;
	componentExport;
	componentId;
	constructor(result, props, slots, displayName) {
		this.result = result;
		this.props = props;
		this.slots = slots;
		this.displayName = displayName;
	}
	async init() {
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
	async render(destination) {
		const hostId = await this.getHostId();
		const islandContent = await this.getIslandContent();
		destination.write(createRenderInstruction({ type: 'server-island-runtime' }));
		destination.write('<!--[if astro]>server-island-start<![endif]-->');
		for (const name in this.slots) {
			if (name === 'fallback') {
				await renderChild(destination, this.slots.fallback(this.result));
			}
		}
		destination.write(
			`<script type="module" data-astro-rerun data-island-id="${hostId}">${islandContent}</script>`,
		);
	}
	getComponentPath() {
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
	getComponentExport() {
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
		const serverIslandNameMap = await this.result.getServerIslandNameMap();
		let componentId = serverIslandNameMap.get(componentPath);
		if (!componentId) {
			throw new Error(`Could not find server component name ${componentPath}`);
		}
		for (const key2 of Object.keys(this.props)) {
			if (internalProps.has(key2)) {
				delete this.props[key2];
			}
		}
		const renderedSlots = {};
		for (const name in this.slots) {
			if (name !== 'fallback') {
				const content = await renderSlotToString(this.result, this.slots[name]);
				let slotHtml = content.toString();
				const slotContent = content;
				if (Array.isArray(slotContent.instructions)) {
					for (const instruction of slotContent.instructions) {
						if (instruction.type === 'script') {
							slotHtml += instruction.content;
						}
					}
				}
				renderedSlots[name] = slotHtml;
			}
		}
		const key = await this.result.key;
		const componentExportEncrypted = await encryptString(
			key,
			componentExport,
			`export:${componentId}`,
		);
		const propsEncrypted =
			Object.keys(this.props).length === 0
				? ''
				: await encryptString(key, JSON.stringify(this.props), `props:${componentId}`);
		const slotsEncrypted =
			Object.keys(renderedSlots).length === 0
				? ''
				: await encryptString(key, JSON.stringify(renderedSlots), `slots:${componentId}`);
		const hostId = await this.getHostId();
		const slash = this.result.base.endsWith('/') ? '' : '/';
		let serverIslandUrl = `${this.result.base}${slash}_server-islands/${componentId}${this.result.trailingSlash === 'always' ? '/' : ''}`;
		const potentialSearchParams = createSearchParams(
			componentExportEncrypted,
			propsEncrypted,
			slotsEncrypted,
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
		const adapterHeaders = this.result.internalFetchHeaders || {};
		const headersJson = stringifyForScript(adapterHeaders);
		const method = useGETRequest
			? // GET request
				`const headers = new Headers(${headersJson});
let response = await fetch('${serverIslandUrl}', { headers });`
			: // POST request
				`let data = {
	encryptedComponentExport: ${stringifyForScript(componentExportEncrypted)},
	encryptedProps: ${stringifyForScript(propsEncrypted)},
	encryptedSlots: ${stringifyForScript(slotsEncrypted)},
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
const renderServerIslandRuntime = () => {
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
}`
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('//'))
		.join(' '),
);
export { ServerIslandComponent, containsServerDirective, renderServerIslandRuntime };
