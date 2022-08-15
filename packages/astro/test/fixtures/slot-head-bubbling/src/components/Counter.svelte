<script>
  let count = 1;

  function handleClick() {
    count = count + 1;
  }
</script>
  
<div>
  <pre>{count}</pre>
  <button on:click={handleClick}>Click</button>
</div>
