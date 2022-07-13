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

		let _slots = {};
		if (Object.keys(slotted).length > 0) {
			// hydrating
			if (sharedConfig.context) {
				element.querySelectorAll('astro-slot').forEach((slot) => {
					_slots[slot.getAttribute('name') || 'default'] = slot.cloneNode(true);
				});
			} else {
				for (const [key, value] of Object.entries(slotted)) {
					_slots[key] = document.createElement('astro-slot');
					if (key !== 'default') _slots[key].setAttribute('name', key);
					_slots[key].innerHTML = value;
				}
			}
		}

		const { default: children, ...slots } = _slots;

		fn(
			() =>
				createComponent(Component, {
					...props,
					...slots,
					children,
				}),
			element
		);
	};
