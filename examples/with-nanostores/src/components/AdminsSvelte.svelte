<script>
  import { admins } from '../store/admins.js';
  import { counter, increaseCounter, decreaseCounter } from '../store/counter.js';
</script>

<h1>Svelte</h1>
<ul>
  {#each $admins as admin}
    <li>{JSON.stringify(admin, null, 2)}</li>
  {/each}
</ul>
<div>
  <h3>Counter</h3>
  <p>{$counter.value}</p>
  <button on:click={decreaseCounter}>-1</button>
  <button on:click={increaseCounter}>+1</button>
</div>
<br />
<!-- Just to get rid of a warning -->
<slot />
