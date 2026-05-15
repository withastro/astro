import { collapseDuplicateLeadingSlashes } from '@astrojs/internal-helpers/path';
function sanitizeParams(params) {
	return Object.fromEntries(
		Object.entries(params).map(([key, value]) => {
			if (typeof value === 'string') {
				return [key, value.normalize().replace(/#/g, '%23').replace(/\?/g, '%3F')];
			}
			return [key, value];
		}),
	);
}
function getParameter(part, params) {
	if (part.spread) {
		return params[part.content.slice(3)] || '';
	}
	if (part.dynamic) {
		if (!params[part.content]) {
			throw new TypeError(`Missing parameter: ${part.content}`);
		}
		return params[part.content];
	}
	return part.content
		.normalize()
		.replace(/\?/g, '%3F')
		.replace(/#/g, '%23')
		.replace(/%5B/g, '[')
		.replace(/%5D/g, ']');
}
function getSegment(segment, params) {
	const segmentPath = segment.map((part) => getParameter(part, params)).join('');
	return segmentPath ? collapseDuplicateLeadingSlashes('/' + segmentPath) : '';
}
function getRouteGenerator(segments, addTrailingSlash) {
	return (params) => {
		const sanitizedParams = sanitizeParams(params);
		let trailing = '';
		if (addTrailingSlash === 'always' && segments.length) {
			trailing = '/';
		}
		const path =
			segments.map((segment) => getSegment(segment, sanitizedParams)).join('') + trailing;
		return path || '/';
	};
}
export { getRouteGenerator };
