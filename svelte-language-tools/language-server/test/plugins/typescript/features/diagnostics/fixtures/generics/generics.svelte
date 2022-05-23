<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  type A = $$Generic;
  type B = $$Generic<keyof A>;
  type C = $$Generic<boolean>;

  export let a: A[];
  export let b: B;
  export let c: C;

  const dispatch = createEventDispatcher<{ b: A }>();
  dispatch('b', a[0]);
</script>

<slot a={a[0]} {b} />
