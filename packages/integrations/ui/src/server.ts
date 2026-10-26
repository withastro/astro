// Helpers the integration inserts into compiled templates. Non-signals pass
// through untouched; signals render their value plus a binding marker.
import { escapeHTML, markHTMLString } from 'astro/runtime/server/index.js';
import { getSignalId } from './signals.js';

const encode = (v: unknown) => encodeURIComponent(JSON.stringify(v ?? null));

export function text(value: unknown) {
	const id = getSignalId(value);
	if (!id) return value;
	const v = (value as () => unknown)();
	return markHTMLString(`<!--ui:t ${id} ${encode(v)}-->${escapeHTML(String(v ?? ''))}<!--/ui:t-->`);
}

export function val(value: unknown) {
	return getSignalId(value) ? (value as () => unknown)() : value;
}

export function bind(value: unknown) {
	const id = getSignalId(value);
	return id ? `${id}:${encode((value as () => unknown)())}` : undefined;
}
