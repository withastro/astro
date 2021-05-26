import SvelteWrapper from './Wrapper.svelte';

function check(Component) { 
  return Component['render'] && Component['$$render'];
}

async function renderToStaticMarkup (Component, props, children) {
  const { html } = SvelteWrapper.render({ __astro_component: Component, __astro_children: children, ...props });
  return { html };
}

export default {
  check,
  renderToStaticMarkup
};
