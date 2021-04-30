import SvelteWrapper from '../SvelteWrapper.svelte.client';
import type { SvelteComponent } from 'svelte';

export default (target: Element, component: SvelteComponent, props: any, children: string) => {
  new SvelteWrapper({
    target,
    props: { __astro_component: component, __astro_children: children, ...props },
    hydrate: true,
  });
};
