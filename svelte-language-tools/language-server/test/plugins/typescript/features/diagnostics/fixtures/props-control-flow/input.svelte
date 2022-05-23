<script lang="ts">
    type Test =
        | { type: 'TypeA'; uniqueToA: string }
        | { type: 'TypeB'; uniqueToB: string };

    export let test: Test;

    console.log(test.type);

    if (test.type == 'TypeA') {
        console.log(test.uniqueToA);
    }
</script>

{#if test.type == 'TypeA'}
    {test.uniqueToA}
{/if}