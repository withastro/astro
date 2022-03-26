import listen from 'micromorph/spa'

export default () => {
	listen({
		afterDiff() {
			window.dispatchEvent(new CustomEvent('astro:locationchange'))
		}
	});
}
