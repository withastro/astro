<script>
	let count = $state(0)

	let { subheading } = $props()
</script>

<h1 id="my-heading">Hello from Svelte!</h1>
<h2>{subheading}</h2>
<p id="count">{count}</p>
