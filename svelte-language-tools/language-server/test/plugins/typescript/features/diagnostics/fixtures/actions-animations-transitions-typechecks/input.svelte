<script lang="ts">
  import { draw } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  function action(node: HTMLInputElement) {
      node;
  }
</script>

<div transition:draw></div>
<path transition:draw></path>

<p animate:flip></p>

<p use:action></p>
<input use:action />
