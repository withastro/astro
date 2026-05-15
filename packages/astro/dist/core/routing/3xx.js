import { escape } from 'html-escaper';
function redirectTemplate({ status, absoluteLocation, relativeLocation, from }) {
	const delay = status === 302 ? 2 : 0;
	const rel = escape(String(relativeLocation));
	const abs = escape(String(absoluteLocation));
	const fromHtml = from ? `from <code>${escape(from)}</code> ` : '';
	return `<!doctype html>
<title>Redirecting to: ${rel}</title>
<meta http-equiv="refresh" content="${delay};url=${rel}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${abs}">
<body>
	<a href="${rel}">Redirecting ${fromHtml}to <code>${rel}</code></a>
</body>`;
}
export { redirectTemplate };
