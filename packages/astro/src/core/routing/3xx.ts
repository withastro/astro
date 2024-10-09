export type RedirectTemplate = {
	from: string;
	location: string | URL;
	delay: 0 | 2;
};

export function redirectTemplate({ delay, location, from }: RedirectTemplate) {
	return `<!doctype html>
<title>Redirecting to: ${location}</title>
<meta http-equiv="refresh" content="${delay};url=${location}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${location}">
<body>
	<a href="${location}">Redirecting from <code>${from}</code> to <code>${location}</code></a>
</body>`;
}
