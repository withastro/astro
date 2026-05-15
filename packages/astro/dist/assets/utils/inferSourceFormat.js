import { removeQueryString } from '@astrojs/internal-helpers/path';
const DATA_PREFIX = 'data:';
function inferSourceFormat(src) {
	if (src.startsWith(DATA_PREFIX)) {
		const mime = src.slice(DATA_PREFIX.length, src.indexOf(';'));
		if (mime === 'image/svg+xml') return 'svg';
		const sub = mime.split('/')[1];
		return sub || void 0;
	}
	try {
		const cleanSrc = removeQueryString(src).split('#')[0];
		const lastDot = cleanSrc.lastIndexOf('.');
		if (lastDot === -1) return void 0;
		return cleanSrc.slice(lastDot + 1).toLowerCase();
	} catch {
		return void 0;
	}
}
export { inferSourceFormat };
