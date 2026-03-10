import { h, hydrate, render } from 'preact';
import StaticHtml from './static-html.js';
import type { SignalLike } from './types.js';

const sharedSignalMap = new Map<string, SignalLike>();

// Counter for client:only islands that don't have a server-assigned island ID
let clientOnlyIslandCount = 0;

export default (element: HTMLElement) =>
	async (
		Component: any,
		props: Record<string, any>,
		{ default: children, ...slotted }: Record<string, any>,
		{ client }: Record<string, string>,
	) => {
		if (!element.hasAttribute('ssr')) return;
		for (const [key, value] of Object.entries(slotted)) {
			props[key] = h(StaticHtml, { value, name: key });
		}
		let signalsRaw = element.dataset.preactSignals;
		if (signalsRaw) {
			const { signal } = await import('@preact/signals');
			let signals: Record<string, string | [string, number][]> = JSON.parse(
				element.dataset.preactSignals!,
			);
			for (const [propName, signalId] of Object.entries(signals)) {
				if (Array.isArray(signalId)) {
					signalId.forEach(([id, indexOrKeyInProps]) => {
						const mapValue = props[propName][indexOrKeyInProps];
						let valueOfSignal = mapValue;

						// not a property key
						if (typeof indexOrKeyInProps !== 'string') {
							valueOfSignal = mapValue[0];
							indexOrKeyInProps = mapValue[1];
						}

						if (!sharedSignalMap.has(id)) {
							const signalValue = signal(valueOfSignal);
							sharedSignalMap.set(id, signalValue);
						}
						props[propName][indexOrKeyInProps] = sharedSignalMap.get(id);
					});
				} else {
					if (!sharedSignalMap.has(signalId)) {
						const signalValue = signal(props[propName]);
						sharedSignalMap.set(signalId, signalValue);
					}
					props[propName] = sharedSignalMap.get(signalId);
				}
			}
		}

		const child = h(
			Component,
			props,
			children != null ? h(StaticHtml, { value: children }) : children,
		);

		// Set a unique mask on the VNode so that Preact's useId() hook generates
		// unique IDs across islands, matching the server-rendered IDs.
		// Preact's useId() checks for `_mask` (source) / `__m` (mangled) on VNodes.
		// We set both to ensure correctness regardless of which Preact build is resolved.
		const islandIdAttr = element.dataset.preactIslandId;
		if (islandIdAttr != null) {
			const mask: [number, number] = [Number.parseInt(islandIdAttr, 10), 0];
			(child as any)._mask = mask;
			(child as any).__m = mask;
		} else if (client === 'only') {
			// For client:only components, use a client-side counter to ensure uniqueness
			const mask: [number, number] = [clientOnlyIslandCount++, 0];
			(child as any)._mask = mask;
			(child as any).__m = mask;
		}

		if (client === 'only') {
			element.innerHTML = '';
			render(child, element);
		} else {
			hydrate(child, element);
		}

		// Preact has no "unmount" option, but you can use `render(null, element)`
		element.addEventListener('astro:unmount', () => render(null, element), { once: true });
	};
