import { createRawSnippet, hydrate, mount, unmount } from 'svelte';

const existingApplications = new WeakMap<HTMLElement, ReturnType<typeof createComponent>>();

export default (element: HTMLElement) => {
	return async (
		Component: any,
		props: Record<string, any>,
		slotted: Record<string, any>,
		{ client }: Record<string, string>,
	) => {
		if (!element.hasAttribute('ssr')) return;

		let children = undefined;
		let _$$slots: Record<string, any> | undefined = undefined;
		let renderFns: Record<string, any> = {};

		for (const [key, value] of Object.entries(slotted)) {
			// Legacy slot support
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

		const resolvedProps = {
			...props,
			children,
			$$slots: _$$slots,
			...renderFns,
		};
		if (existingApplications.has(element)) {
			existingApplications.get(element)!.setProps(resolvedProps);
		} else {
			const component = createComponent(Component, element, resolvedProps, client !== 'only');
			existingApplications.set(element, component);
			element.addEventListener('astro:unmount', () => component.destroy(), { once: true });
		}
	};
};

function createComponent(
	Component: any,
	target: HTMLElement,
	props: Record<string, any>,
	shouldHydrate: boolean,
) {
	let propsState = $state(props);
	const bootstrap = shouldHydrate ? hydrate : mount;
	if (!shouldHydrate) {
		target.innerHTML = '';
	}
	const component = bootstrap(Component, { target, props: propsState });
	return {
		setProps(newProps: Record<string, any>) {
			Object.assign(propsState, newProps);
			// Remove props in `propsState` but not in `newProps`
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
