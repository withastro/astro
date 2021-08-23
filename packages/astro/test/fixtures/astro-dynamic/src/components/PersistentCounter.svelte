
<script>
  import './logResize';

  let count = parseInt(localStorage.getItem('test:count')) || 0;
  $: localStorage.setItem('test:count', count);

  function add() {
    count += 1;
  }
  
  function subtract() {
    count -= 1;
  }
</script>
  
<div class="counter">
  <button on:click={subtract}>-</button>
  <pre>{ count }</pre>
  <button on:click={add}>+</button>
</div>
  