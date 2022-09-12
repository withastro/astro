import type { SignalLike } from './types';
import { h, render } from 'preact';
import StaticHtml from './static-html.js';
// TODO change this
import { signal } from '@preact/signals';

const sharedSignalMap: Map<string, SignalLike> = new Map();

export default (element: HTMLElement) =>
	(Component: any, props: Record<string, any>, { default: children, ...slotted }: Record<string, any>) => {
		console.log("HERE I AM 2")
		if (!element.hasAttribute('ssr')) return;
		for (const [key, value] of Object.entries(slotted)) {
			props[key] = h(StaticHtml, { value, name: key });
		}
		let signalsRaw = element.dataset.preactSignals;
		if(signalsRaw) {
			let signals: Record<string, string> = JSON.parse(element.dataset.preactSignals as string);
			for(const [propName, signalId] of Object.entries(signals)) {
				if(!sharedSignalMap.has(signalId)) {
					const signalValue = signal(props[propName]);
					sharedSignalMap.set(signalId, signalValue);
				}
				props[propName] = sharedSignalMap.get(signalId);
			}
		}
		render(
			h(Component, props, children != null ? h(StaticHtml, { value: children }) : children),
			element
		);
	};
