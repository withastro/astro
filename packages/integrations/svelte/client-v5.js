import { createRawSnippet, hydrate, mount, unmount } from 'svelte';

export default (element) => {
	return async (Component, props, slotted, { client }) => {
		if (!element.hasAttribute('ssr')) return;

		let $$slots = undefined;
		for (const [key, value] of Object.entries(slotted)) {
			$$slots ??= {};
			$$slots[key] = createRawSnippet({
				mount() {
					const el = document.createElement('astro-slot');
					if (key !== 'default') el.setAttribute('name', key);
					el.innerHTML = value;
					return el;
				},
			});
		}

		const bootstrap = client !== 'only' ? hydrate : mount;

		const component = bootstrap(Component, {
			target: element,
			props: {
				...props,
				$$slots,
			},
		});

		element.addEventListener('astro:unmount', () => unmount(component), { once: true });
	};
};
