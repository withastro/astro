import { h, hydrate, render } from 'preact';
import StaticHtml from './static-html.js';
import type { SignalLike, Signals } from './types.js';

const sharedSignalMap = new Map<string, SignalLike>();
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
			let signals: Signals = JSON.parse(element.dataset.preactSignals!);

			function processProp(value: any, path: string[]): any {
				const [topLevelKey, ...restPath] = path;
				const nestedPath = restPath.join('.');

				if (Array.isArray(value)) {
					return value.map((v, index) =>
						processProp(v, [topLevelKey, ...restPath, index.toString()]),
					);
				} else if (typeof value === 'object' && value !== null) {
					const newObj: Record<string, any> = {};
					for (const [key, val] of Object.entries(value)) {
						newObj[key] = processProp(val, [topLevelKey, ...restPath, key]);
					}
					return newObj;
				} else if (signals[topLevelKey]) {
					let signalId = signals[topLevelKey];

					if (typeof signalId !== 'string') {
						signalId = signalId[nestedPath];
					}

					if (!sharedSignalMap.has(signalId)) {
						sharedSignalMap.set(signalId, signal(value));
					}
					return sharedSignalMap.get(signalId);
				}

				return value;
			}

			for (const [key, value] of Object.entries(props)) {
				props[key] = processProp(value, [key]);
			}
		}

		const bootstrap = client !== 'only' ? hydrate : render;

		bootstrap(
			h(Component, props, children != null ? h(StaticHtml, { value: children }) : children),
			element,
		);

		// Preact has no "unmount" option, but you can use `render(null, element)`
		element.addEventListener('astro:unmount', () => render(null, element), { once: true });
	};
