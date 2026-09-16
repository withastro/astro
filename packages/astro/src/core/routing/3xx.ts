import { escape } from 'html-escaper';

type RedirectTemplate = {
	from?: string;
	absoluteLocation: string | URL;
	status: number;
	relativeLocation: string;
};

/**
 * Generates a minimal HTML redirect page used for SSR redirects.
 */
export function redirectTemplate({
	status,
	absoluteLocation,
	relativeLocation,
	from,
}: RedirectTemplate) {
	// A short delay causes Google to interpret the redirect as temporary.
	// https://developers.google.com/search/docs/crawling-indexing/301-redirects#metarefresh
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
