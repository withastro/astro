<script>
	let { start } = $props();
	let count = $state(start);
</script>

<button onclick={() => count++}>count: {count}</button>
