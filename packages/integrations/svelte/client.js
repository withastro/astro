import SvelteWrapper from './Wrapper.svelte';

export default (target) => {
	return (component, props, children, { client }) => {
		delete props['class'];
		try {
			new SvelteWrapper({
				target,
				props: { __astro_component: component, __astro_children: children, ...props },
				hydrate: client !== 'only',
			});
		} catch (e) {}
	};
};
