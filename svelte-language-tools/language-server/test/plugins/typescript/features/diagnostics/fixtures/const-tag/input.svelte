<script lang="ts">
    const promise = Promise.resolve({foo: true});
    const shadowed = true;
    shadowed;
</script>

<!-- valid -->
{#await promise then result}
    {@const bar = result}
    {@const str = "hello"}
    {@const shadowed = "shadowed"}
    {bar === result}
    {str === "hello"}
    {shadowed === "shadowed"}
{:catch e}
    {@const bar = e}
    {@const str = "hello"}
    {bar}
    {str === "hello"}
{/await}

{#each [1, 2] as item}
    {@const x = item * 2}
    {@const shadowed = item * 3}
    {x === shadowed}
{/each}

<!-- invalid -->
{#await promise then result}
    {@const unused = doesntExist}
    {@const str = "hello"}
    {str === true}
{:catch e}
    {@const unused = doesntExist}
    {@const str = "hello"}
    {str === true}
{/await}

{#each [1, 2] as item}
    {@const unused = doesntExist}
    {@const x = item * 2}
    {x === "asd"}
{/each}
