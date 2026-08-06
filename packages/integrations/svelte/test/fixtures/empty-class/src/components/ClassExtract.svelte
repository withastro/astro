<script>
	// Extract class property with null default, matching the issue report
	let { class: className = null, ...props } = $props();
</script>

<div class={className} {...props}>
	Content
</div>
