import { renderChild } from "./any.js";
import type { RenderInstance } from "./common.js";

const internalProps = new Set([
	'server:component-path',
	'server:component-export',
	'server:component-directive',
	'server:defer'
]);

export function containsServerDirective(props: Record<string | number, any>,) {
	return 'server:component-directive' in props;
}

export function renderServerIsland(
	displayName: string,
	props: Record<string | number, any>,
	slots: any,
): RenderInstance {
	return {
		async render(destination) {
			const componentPath = props['server:component-path'];
			const componentExport = props['server:component-export'];
			
			// Remove internal props
			for(const key of Object.keys(props)) {
				if(internalProps.has(key)) {
					delete props[key];
				}
			}
		
			destination.write('<!--server-island-start-->')

			// Render the slots
			const renderedSlots = {};
			if(slots.fallback) {
				await renderChild(destination, slots.fallback());
			}


			const hostId = crypto.randomUUID();

			destination.write(`<script async type="module" data-island-id="${hostId}">
let componentPath = ${JSON.stringify(componentPath)};
let componentExport = ${JSON.stringify(componentExport)};
let script = document.querySelector('script[data-island-id="${hostId}"]');
let data = {
	componentPath,
	componentExport,
	props: ${JSON.stringify(props)},
	slot: ${JSON.stringify(slots)},
};

let response = await fetch('/_server-islands/${displayName}', {
	method: 'POST',
	body: JSON.stringify(data),
});

if(response.status === 200 && response.headers.get('content-type') === 'text/html') {
	let html = await response.text();

	// Swap!
	while(script.previousSibling?.nodeType !== 8 &&
		script.previousSibling?.data !== 'server-island-start') {
		script.previousSibling?.remove();
	}
	script.previousSibling?.remove();

	let frag = document.createRange().createContextualFragment(html);
	script.before(frag);
	//script.insertAdjacentHTML('beforebegin', html);
}
script.remove();
</script>`)
		}
	}
}
