import SvelteWrapper from './Wrapper.svelte';

export default (target) => {
	return (component, props, children) => {
		delete props['class'];
		try {
			new SvelteWrapper({
				target,
				props: { __astro_component: component, __astro_children: children, ...props },
				hydrate: true,
			});
		} catch (e) {}
	};
};
