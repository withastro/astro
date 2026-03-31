<script lang="ts" generics="T extends 'ordered' | 'unordered' = 'unordered'">
  interface Props {
    variant?: T;
    items: T extends 'ordered' ? number[] : string[];
  }

  let { variant, items }: Props = $props();
</script>

<ul>
  {#each items as item}
    <li>{item} ({variant})</li>
  {/each}
</ul>
