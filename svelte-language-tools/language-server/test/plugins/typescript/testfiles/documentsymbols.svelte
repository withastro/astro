<script>
  function bla() {
    return true;
  }
  bla();
  $: hello = 1;
  $: if (hello) {
    console.log('hi');
  }
</script>

<div foo={hello} {bar} on:click={() => ''} />
<Component foo={hello} {bar} on:click={() => ''} />
<Component let:x let:a={b}>
  <div slot="fo" let:x let:a={b} />
</Component>
{#each [1, 2] as foo}
  {@const bar = foo}
  {bar}
{/each}
{#await x then result}
  {@const bar = result}
  {bar}
{:catch error}
  {error}
{/await}
{#key bla}{/key}
