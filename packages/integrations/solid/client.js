import { sharedConfig } from 'solid-js';
import { hydrate, render, createComponent } from 'solid-js/web';

export default (element) =>
	(Component, props, slotted, { client }) => {
		// Prepare global object expected by Solid's hydration logic
		if (!window._$HY) {
			window._$HY = { events: [], completed: new WeakSet(), r: {} };
		}
		if (!element.hasAttribute('ssr')) return;

		const fn = client === 'only' ? render : hydrate;

		let slots;
		function getSlots() {
			if (!slots && Object.keys(slotted).length > 0) {
				// hydrating
				if (sharedConfig.context) {
					slots = {};
					element.querySelectorAll('astro-slot').forEach(slot => {
						slots[slot.getAttribute('name') || 'default'] = slot;
					})
				}

				if (!slots) {
						slots = {};
						for (const [key, value] of Object.entries(slotted)) {
							slots[key] = document.createElement('astro-slot');
							if (key !== 'default') slots[key].setAttribute('name', key);
							slots[key].innerHTML = value;
						}
					}
			}
			return slots;
		}

		fn(
			() =>
				createComponent(Component, {
					...props,
					get slots() {
						const { default: _, ...slots } = getSlots();
						return slots;
					},
					get children() {
						const { default: children } = getSlots();
						return children;
					},
				}),
			element
		);
	};
