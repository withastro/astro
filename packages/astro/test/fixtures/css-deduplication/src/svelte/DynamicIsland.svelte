<script>
	let Shared = $state(null);
	async function load() {
		Shared = (await import('./Shared.svelte')).default;
	}
</script>

<button onclick={load}>Load</button>
{#if Shared}<Shared />{/if}
