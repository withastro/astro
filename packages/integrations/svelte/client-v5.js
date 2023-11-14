import { mount } from 'svelte';

export default (element) => {
	return async (Component, props, slotted) => {
		if (!element.hasAttribute('ssr')) return;

		let children = undefined;
		let $$slots = undefined;
		for (const [key, value] of Object.entries(slotted)) {
			if (key === 'default') {
				children = createSlotDefinition(key, value);
			} else {
				$$slots ??= {};
				$$slots[key] = createSlotDefinition(key, value);
			}
		}

		const [, destroy] = mount(Component, {
			target: element,
			props: {
				...props,
				children,
				$$slots,
			},
		});

		element.addEventListener('astro:unmount', () => destroy(), { once: true });
	};
};

function createSlotDefinition(key, children) {
	/**
	 * @param {Comment} $$anchor
	 */
	return ($$anchor, _$$props) => {
		// $$anchor is a comment node for slots in Svelte 5
		const el = document.createElement('div');
		el.innerHTML = `<astro-slot${
			key === 'default' ? '' : ` name="${key}"`
		}>${children}</astro-slot>`;
		$$anchor.replaceWith(el.children[0]);
	};
}
