<script>
  import { onDestroy } from 'svelte';  
  import { getState, subscribe } from '../store'
  
  let unsub = subscribe((s) => bears = s.bears)
  let bears = 0
  onDestroy(() => unsub())
</script>

<div id="svelte" class="counter">
  <button on:click={getState().increasePopulation}>one up</button>
  <h1>{ bears } around here ...</h1>
</div>
