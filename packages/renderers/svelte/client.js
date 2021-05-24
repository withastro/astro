import SvelteWrapper from './Wrapper.svelte';

export default function hydrateStaticMarkup(target) {
  return (component, props, children) => {
    new SvelteWrapper({
      target,
      props: { __astro_component: component, __astro_children: children, ...props },
      hydrate: true,
    }); 
  }
}
