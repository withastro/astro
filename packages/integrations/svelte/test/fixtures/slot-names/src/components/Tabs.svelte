<script>
	let { active, ...snippets } = $props();
</script>

<div id="tabs">{@render snippets[active]?.()}</div>
