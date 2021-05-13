<script>
const { __astro_component: Component, __astro_children, ...props } = $$props;
</script>

<svelte:component this={Component} {...props}>
    {@html __astro_children}
</svelte:component>
