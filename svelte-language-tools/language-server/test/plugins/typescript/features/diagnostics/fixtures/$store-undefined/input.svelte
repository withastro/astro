<script lang="ts">
  import type { Writable } from "svelte/store";

  interface Interface {
    fn: () => number;
  }
  let interfaceStore: Writable<Interface> | undefined;
  // error
  $interfaceStore.fn();
  const result1 = $interfaceStore ? $interfaceStore.fn() === '1' : false;result1;
  // ok
  $interfaceStore?.fn();
  const result2 = $interfaceStore ? $interfaceStore.fn() === 1 : false;result2;
</script>
