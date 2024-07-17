import { createRawSnippet, hydrate, mount, unmount } from 'svelte';

export default (element) => {
	return async (Component, props, slotted, { client }) => {
		if (!element.hasAttribute('ssr')) return;

		let children = undefined;
		let $$slots = undefined;
		for (const [key, value] of Object.entries(slotted)) {
			$$slots ??= {};
			if (key === 'default') {
				$$slots.default = true;
				children = createRawSnippet(() => ({
					render: () => `<astro-slot>${value}</astro-slot>`,
				}));
			} else {
				$$slots[key] = createRawSnippet(() => ({
					render: () => `<astro-slot name="${key}">${value}</astro-slot>`,
				}));
			}
		}

		const bootstrap = client !== 'only' ? hydrate : mount;

		const component = bootstrap(Component, {
			target: element,
			props: {
				...props,
				children,
				$$slots,
			},
		});

		element.addEventListener('astro:unmount', () => unmount(component), { once: true });
	};
};
