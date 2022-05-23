<script lang="typescript">
export let noUsedBeforeDeclare: number, anotherUsed: boolean;
const blubb = 2;
$: bla = blubb * 2;
</script>
<p on:click on:click></p>
{bla}
{noUsedBeforeDeclare}
{anotherUsed}