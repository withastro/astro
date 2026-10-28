<script>
	let { id } = $props();
	let count = $state(0);
</script>

<button {id} onclick={() => count++}>svelte {count}</button>
