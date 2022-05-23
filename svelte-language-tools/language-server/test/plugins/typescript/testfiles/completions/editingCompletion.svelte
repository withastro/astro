<script>
    let b = { c: 1 };
</script>

{b.}

{#await b.}
    
{/await}

{#key b.}
    
{/key}

{@html b.}

{#if b.}
    
{/if}

{#each [b] as _b}
    {@const _hi2 = _b.}
{/each}

<div use:action={b.}></div>

<div transition:fade={b.}></div>

<button on:click={() => b.}></button>

<input bind:value={b.}>

<input value={b.}>

<div class:active={b.}></div>

<div style:position={b.}></div>

<div animate:animate={b.}></div>

<Component hi={b.}></Component>

<Component bind:hi={b.}></Component>

<Component on:click={() => b.}></Component>