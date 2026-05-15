const EXTERNAL_URL_REGEX = /^(?:[a-z+]+:)?\/\//i;
const perf = [
	{
		code: 'perf-use-image-component',
		title: 'Use the Image component',
		message: 'This image could be replaced with the Image component to improve performance.',
		selector: 'img:not([data-image-component])',
		async match(element) {
			if (element.closest('astro-island')) return false;
			const src = element.getAttribute('src');
			if (!src) return false;
			if (src.startsWith('data:')) return false;
			if (!EXTERNAL_URL_REGEX.test(src)) {
				const imageData = await fetch(src).then((response) => response.blob());
				if (imageData.size < 20480) return false;
			}
			return true;
		},
	},
	{
		code: 'perf-use-loading-lazy',
		title: 'Unoptimized loading attribute',
		message: (element) =>
			`This ${element.nodeName} tag is below the fold and could be lazy-loaded to improve performance.`,
		selector:
			'img:not([loading]), img[loading="eager"], iframe:not([loading]), iframe[loading="eager"]',
		match(element) {
			const htmlElement = element;
			let currentElement = element;
			let elementYPosition = 0;
			while (currentElement) {
				elementYPosition += currentElement.offsetTop;
				currentElement = currentElement.offsetParent;
			}
			if (elementYPosition < window.innerHeight) return false;
			if (htmlElement.src.startsWith('data:')) return false;
			return true;
		},
	},
	{
		code: 'perf-use-loading-eager',
		title: 'Unoptimized loading attribute',
		message: (element) =>
			`This ${element.nodeName} tag is above the fold and could be eagerly-loaded to improve performance.`,
		selector: 'img[loading="lazy"], iframe[loading="lazy"]',
		match(element) {
			const htmlElement = element;
			let currentElement = element;
			let elementYPosition = 0;
			while (currentElement) {
				elementYPosition += currentElement.offsetTop;
				currentElement = currentElement.offsetParent;
			}
			if (elementYPosition > window.innerHeight) return false;
			if (htmlElement.src.startsWith('data:')) return false;
			return true;
		},
	},
	{
		code: 'perf-use-videos',
		title: 'Use videos instead of GIFs for large animations',
		message:
			'This GIF could be replaced with a video to reduce its file size and improve performance.',
		selector: 'img[src$=".gif"]',
		async match(element) {
			const src = element.getAttribute('src');
			if (!src) return false;
			if (EXTERNAL_URL_REGEX.test(src)) return false;
			if (!EXTERNAL_URL_REGEX.test(src)) {
				const imageData = await fetch(src).then((response) => response.blob());
				if (imageData.size < 102400) return false;
			}
			return true;
		},
	},
	{
		code: 'perf-slow-component-server-render',
		title: 'Server-rendered component took a long time to render',
		message: (element) =>
			`This component took an unusually long time to render on the server (${getCleanRenderingTime(
				element.getAttribute('server-render-time'),
			)}). This might be a sign that it's doing too much work on the server, or something is blocking rendering.`,
		selector: 'astro-island[server-render-time]',
		match(element) {
			const serverRenderTime = element.getAttribute('server-render-time');
			if (!serverRenderTime) return false;
			const renderingTime = Number.parseFloat(serverRenderTime);
			if (Number.isNaN(renderingTime)) return false;
			return renderingTime > 500;
		},
	},
	{
		code: 'perf-slow-component-client-hydration',
		title: 'Client-rendered component took a long time to hydrate',
		message: (element) =>
			`This component took an unusually long time to render on the server (${getCleanRenderingTime(
				element.getAttribute('client-render-time'),
			)}). This could be a sign that something is blocking the main thread and preventing the component from hydrating quickly.`,
		selector: 'astro-island[client-render-time]',
		match(element) {
			const clientRenderTime = element.getAttribute('client-render-time');
			if (!clientRenderTime) return false;
			const renderingTime = Number.parseFloat(clientRenderTime);
			if (Number.isNaN(renderingTime)) return false;
			return renderingTime > 500;
		},
	},
];
function getCleanRenderingTime(time) {
	if (!time) return 'unknown';
	const renderingTime = Number.parseFloat(time);
	if (Number.isNaN(renderingTime)) return 'unknown';
	return renderingTime.toFixed(2) + 's';
}
export { perf };
