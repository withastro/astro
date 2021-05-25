import Wrapper from './Wrapper.svelte';

export default {
  name: '@astro-renderer/svelte',
  check: (Component) => Component['render'] && Component['$$render'],
  renderToStaticMarkup: (Component, props, children) => {
    const { html } = Wrapper.render({ __astro_component: Component, __astro_children: children, ...props });
    return { html };
  }
};
