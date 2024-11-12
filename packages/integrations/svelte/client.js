import { createRawSnippet } from 'svelte';
import { createClassComponent } from 'svelte/legacy';

/** @type {WeakMap<HTMLElement, ReturnType<typeof createClassComponent>} */
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

		if (existingApplications.has(element)) {
			existingApplications.get(element).$set({
				...props,
				children,
				$$slots,
				...renderFns,
			});
		} else {
			// Svelte 5 makes it very hard to update props for some reason, simply use
			// `createClassComponent` so that it does the heavylifting around props itself.
			// https://github.com/sveltejs/svelte/blob/53af138d588f77bb8f4f10f9ad15fd4f798b50ef/packages/svelte/src/legacy/legacy-client.js#L91-L109
			const component = createClassComponent({
				target: element,
				component: Component,
				props: {
					...props,
					children,
					$$slots,
					...renderFns,
				},
				hydrate: client !== 'only',
			});
			existingApplications.set(element, component);
			element.addEventListener('astro:unmount', () => component.$destroy(), { once: true });
		}
	};
};
