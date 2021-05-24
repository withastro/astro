<script>
const { __astro_component: Component, __astro_children, ...props } = $$props;
</script>

<svelte:component this={Component} {...props}>
  <div data-astro-children="">
    {@html __astro_children ? __astro_children : ''}
  </div>
</svelte:component>
