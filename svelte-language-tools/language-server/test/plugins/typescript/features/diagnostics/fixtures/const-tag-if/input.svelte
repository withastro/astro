<script lang="ts">
    let value: string | number | boolean;
</script>

<!-- valid -->
{#if typeof value === 'string'}
    {@const valueStr = value}
    {@const valueStr2 = valueStr}

    <div>{valueStr.substring(0)}{valueStr2.substring(0)}</div>

    <button on:click={() => {valueStr.substring(0)}}></button>
{:else if typeof value === 'number'}
    {value.toFixed()}
{/if}

<!-- invalid -->
{#if typeof value === 'string'}
    {@const valueStr = value}
    {@const valueStr2 = valueStr}

    <div>{valueStr.toFixed()}{valueStr2.toFixed()}</div>
{:else if typeof value === 'number'}
    {value.substring(0)}
{:else}
    {value.toFixed()}
{/if}