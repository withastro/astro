import { createRawSnippet, hydrate, mount, unmount } from 'svelte';

const existingApplications = new WeakMap();

export default (element) => {
	return async (Component, props, slotted, { client }) => {
		if (!element.hasAttribute('ssr')) return;

		let children = undefined;
		let $$slots = undefined;
		let renderFns = {};

		for (const [key, value] of Object.entries(slotted)) {
			// Legacy slot support
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
			// @render support for Svelte ^5.0
			if (key === 'default') {
				renderFns.children = createRawSnippet(() => ({
					render: () => `<astro-slot>${value}</astro-slot>`,
				}));
			} else {
				renderFns[key] = createRawSnippet(() => ({
					render: () => `<astro-slot name="${key}">${value}</astro-slot>`,
				}));
			}
		}

		const bootstrap = client !== 'only' ? hydrate : mount;
		if (existingApplications.has(element)) {
			existingApplications.get(element).$set({
				...props,
				children,
				$$slots,
				...renderFns,
			});
		} else {
			const component = bootstrap(Component, {
				target: element,
				props: {
					...props,
					children,
					$$slots,
					...renderFns,
				},
			});
			existingApplications.set(element, component);
			element.addEventListener('astro:unmount', () => unmount(component), { once: true });
		}
	};
};
