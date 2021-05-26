<script>
/** 
  * Why do we need a wrapper component?
  * 
  * Astro passes `children` as a string of HTML, so we need
  * a way to render that content.
  * 
  * Rather than passing a magical prop which needs special 
  * handling, using this wrapper allows Svelte users to just
  * use `<slot />` like they would for any other component.
  */
const { __astro_component: Component, __astro_children, ...props } = $$props;
</script>

<svelte:component this={Component} {...props}>
  {#if __astro_children}
    <astro-fragment>
      {@html __astro_children}
    </astro-fragment>
  {/if}
</svelte:component>
