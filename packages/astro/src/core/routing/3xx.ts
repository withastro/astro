type RedirectTemplate = {
	from?: string;
	absoluteLocation: string | URL;
	status: number;
	relativeLocation: string;
};

export function redirectTemplate({
	status,
	absoluteLocation,
	relativeLocation,
	from,
}: RedirectTemplate) {
	// A short delay causes Google to interpret the redirect as temporary.
	// https://developers.google.com/search/docs/crawling-indexing/301-redirects#metarefresh
	const delay = status === 302 ? 2 : 0;
	return `<!doctype html>
<title>Redirecting to: ${relativeLocation}</title>
<meta http-equiv="refresh" content="${delay};url=${relativeLocation}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${absoluteLocation}">
<body>
	<a href="${relativeLocation}">Redirecting ${from ? `from <code>${from}</code> ` : ''}to <code>${relativeLocation}</code></a>
</body>`;
}
