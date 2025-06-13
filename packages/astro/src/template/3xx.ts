export type RedirectTemplateOptions = {
	status: number;
	absoluteLocation: string | URL;
	relativeLocation: string;
	from?: string;
};

export default function template({
	status,
	absoluteLocation,
	relativeLocation,
	from,
}: RedirectTemplateOptions): string {
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
