import { createRawSnippet, hydrate, mount, unmount } from 'svelte';
const existingApplications = /* @__PURE__ */ new WeakMap();
var client_svelte_default = (element) => {
	return async (Component, props, slotted, { client }) => {
		if (!element.hasAttribute('ssr')) return;
		let children = void 0;
		let _$$slots = void 0;
		let renderFns = {};
		for (const [key, value] of Object.entries(slotted)) {
			_$$slots ??= {};
			if (key === 'default') {
				_$$slots.default = true;
				children = createRawSnippet(() => ({
					render: () => `<astro-slot>${value}</astro-slot>`,
				}));
			} else {
				_$$slots[key] = createRawSnippet(() => ({
					render: () => `<astro-slot name="${key}">${value}</astro-slot>`,
				}));
			}
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
		const resolvedProps = {
			...props,
			children,
			$$slots: _$$slots,
			...renderFns,
		};
		if (existingApplications.has(element)) {
			existingApplications.get(element).setProps(resolvedProps);
		} else {
			const component = createComponent(Component, element, resolvedProps, client !== 'only');
			existingApplications.set(element, component);
			element.addEventListener('astro:unmount', () => component.destroy(), { once: true });
		}
	};
};
function createComponent(Component, target, props, shouldHydrate) {
	let propsState = $state(props);
	const bootstrap = shouldHydrate ? hydrate : mount;
	if (!shouldHydrate) {
		target.innerHTML = '';
	}
	const component = bootstrap(Component, { target, props: propsState });
	return {
		setProps(newProps) {
			Object.assign(propsState, newProps);
			for (const key in propsState) {
				if (!(key in newProps)) {
					delete propsState[key];
				}
			}
		},
		destroy() {
			unmount(component);
		},
	};
}
export { client_svelte_default as default };
