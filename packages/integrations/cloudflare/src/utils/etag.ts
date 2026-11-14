/** If-None-Match uses weak comparison for GET/HEAD (RFC 9110, section 13.1.2). */
export function matchesIfNoneMatch(value: string | null, etag: string | null): boolean {
	if (value === null) return false;
	// The caller has already checked that a successful representation exists.
	if (value.trim() === '*') return true;
	if (!etag) return false;

	const current = etag.replace(/^W\//, '');
	const tag = /(?:W\/)?"[\x21\x23-\x7e\x80-\xff]*"/y;
	let position = 0;
	let matches = false;
	while (position < value.length) {
		// List recipients must tolerate empty members. Do not split on commas:
		// they are also valid characters inside an opaque entity-tag.
		while (position < value.length && /[\t ,]/.test(value[position])) position++;
		if (position === value.length) break;
		tag.lastIndex = position;
		const match = tag.exec(value);
		if (!match) return false;
		matches ||= match[0].replace(/^W\//, '') === current;
		position = tag.lastIndex;
		while (position < value.length && /[\t ]/.test(value[position])) position++;
		if (position < value.length && value[position++] !== ',') return false;
	}
	return matches;
}
