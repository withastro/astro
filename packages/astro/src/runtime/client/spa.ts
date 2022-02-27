import listen from 'micromorph/spa'

listen({
	afterDiff() {
		window.dispatchEvent(new CustomEvent('astro:locationchange'))
	}
});

