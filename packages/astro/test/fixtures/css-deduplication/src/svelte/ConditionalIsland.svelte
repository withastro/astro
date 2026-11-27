<script>
	import Panel from './Panel.svelte';

	// False during the server render, so Vite tree-shakes Panel's styles from the server build
	let visible = $state(false);
	$effect(() => {
		visible = true;
	});
</script>

{#if visible}<Panel />{/if}
