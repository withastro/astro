import { escape, unescape } from 'html-escaper';

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

/** Every `<meta …>` tag in a document. */
const META_TAG_RE = /<meta\s[^>]*>/gi;

/**
 * An attribute's value, quoted with `"`, with `'`, or bare, decoded back to the
 * text it stands for. Both Astro's renderer and `redirectTemplate` escape
 * attribute values, so a destination like `/new?a=1&b=2` reaches us written as
 * `/new?a=1&amp;b=2`.
 */
function attributeValue(tag: string, name: string): string | undefined {
	const pattern = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
	const match = pattern.exec(tag);
	if (!match) return undefined;
	const value = match[1] ?? match[2] ?? match[3];
	return value === undefined ? undefined : unescape(value);
}

/**
 * Extracts the target of a meta refresh `content` value — the part after
 * `<delay>;url=` — or `undefined` when the value has no `url` directive.
 */
function refreshTarget(content: string): string | undefined {
	const separator = content.indexOf(';');
	if (separator === -1) return undefined;
	const directive = content.slice(separator + 1).trim();
	const equals = directive.indexOf('=');
	if (equals === -1 || directive.slice(0, equals).trim().toLowerCase() !== 'url') {
		return undefined;
	}
	return stripQuotes(directive.slice(equals + 1).trim());
}

function stripQuotes(value: string): string {
	const first = value[0];
	if ((first === '"' || first === "'") && value.length > 1 && value.endsWith(first)) {
		return value.slice(1, -1);
	}
	return value;
}

/**
 * Reports whether `html` contains a `<meta http-equiv="refresh">` tag pointing at
 * `location`.
 *
 * In a static build the meta refresh tag *is* the redirect — there is no `Location`
 * header — so a redirect page that omits it, or points it somewhere else, silently
 * strands visitors.
 */
export function hasMetaRefreshTo(html: string, location: string): boolean {
	for (const [tag] of html.matchAll(META_TAG_RE)) {
		if (attributeValue(tag, 'http-equiv')?.trim().toLowerCase() !== 'refresh') continue;
		const content = attributeValue(tag, 'content');
		if (content !== undefined && refreshTarget(content) === location) {
			return true;
		}
	}
	return false;
}
