<script>
  import { getValue } from 'nanostores'

  import { users } from '../store/users.js';
  import { counter, increaseCounter, decreaseCounter } from '../store/counter.js';

  const list = getValue(users).filter(user => user.isAdmin);
</script>

<h1>Svelte</h1>
<ul>
  {#each list as user}
    <li>{JSON.stringify(user, null, 2)}</li>
  {/each}
</ul>
<div>
  <h3>Counter</h3>
  <p>{$counter}</p>
  <button on:click={decreaseCounter}>-1</button>
  <button on:click={increaseCounter}>+1</button>
</div>
<br />
<!-- Just to get rid of a warning -->
<slot />
