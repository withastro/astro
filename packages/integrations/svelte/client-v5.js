import { hydrate, mount, unmount } from 'svelte';
import { add_snippet_symbol } from 'svelte/internal/client';

// Allow a slot to be rendered as a snippet (dev validation only)
const tagSlotAsSnippet = import.meta.env.DEV ? add_snippet_symbol : (s) => s;

export default (element) => {
	return async (Component, props, slotted, { client }) => {
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

function createSlotDefinition(key, children) {
	/**
	 * @param {Comment} $$anchor A comment node for slots in Svelte 5
	 */
	const fn = ($$anchor, _$$slotProps) => {
		const parent = $$anchor.parentNode;
		const el = document.createElement('div');
		el.innerHTML = `<astro-slot${
			key === 'default' ? '' : ` name="${key}"`
		}>${children}</astro-slot>`;
		parent.insertBefore(el.children[0], $$anchor);
	};
	return tagSlotAsSnippet(fn);
}
