import { h, render, type JSX } from 'preact';
import StaticHtml from './static-html.js';
import type { SignalLike } from './types';

const sharedSignalMap = new Map<string, SignalLike>();

export default (element: HTMLElement) =>
	async (
		Component: any,
		props: Record<string, any>,
		{ default: children, ...slotted }: Record<string, any>
	) => {
		if (!element.hasAttribute('ssr')) return;
		for (const [key, value] of Object.entries(slotted)) {
			props[key] = h(StaticHtml, { value, name: key });
		}
		let signalsRaw = element.dataset.preactSignals;
		if (signalsRaw) {
			const { signal } = await import('@preact/signals');
			let signals: Record<string, string> = JSON.parse(element.dataset.preactSignals!);
			for (const [propName, signalId] of Object.entries(signals)) {
				if (!sharedSignalMap.has(signalId)) {
					const signalValue = signal(props[propName]);
					sharedSignalMap.set(signalId, signalValue);
				}
				props[propName] = sharedSignalMap.get(signalId);
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-shadow
		function Wrapper({ children }: { children: JSX.Element }) {
			let attrs = Object.fromEntries(
				Array.from(element.attributes).map((attr) => [attr.name, attr.value])
			);
			return h(element.localName, attrs, children);
		}

		let parent = element.parentNode as Element;

		render(
			h(
				Wrapper,
				null,
				h(Component, props, children != null ? h(StaticHtml, { value: children }) : children)
			),
			parent,
			element
		);
	};
