<script lang="ts">
</script>

<div>
	<h1>SSI include inside Svelte Page with Nginx</h1>
	<h3>This page demonstrates the need for the directive <code>client:load="dom"</code> on Svelte components which utilize SSI includes.</h3>
	<p>Please load this page via Nginx. Otherwise you will not see the included SSI fragment</p>
	{@html '<!--#include virtual="/fragments_with_delay/ssi" -->'}
	<p>If you change the directive of the Svelte <code>Page</code> inside of <code>index.astro</code> to use <code>client:load</code> this line will be doubled, because Svelte hydration starts too soon and can get mixed up.</p>
</div>
