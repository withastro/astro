// https://vitejs.dev/guide/features.html#css-pre-processors
export const STYLE_EXTENSIONS = new Set([
	'.css',
	'.pcss',
	'.postcss',
	'.scss',
	'.sass',
	'.styl',
	'.stylus',
	'.less',
]);

const cssRe = new RegExp(
	`\\.(${Array.from(STYLE_EXTENSIONS)
		.map((s) => s.slice(1))
		.join('|')})($|\\?)`
);

const rawRE = /(?:\?|&)raw(?:&|$)/;
const inlineRE = /(?:\?|&)inline\b/;

export const isCSSRequest = (request: string): boolean => cssRe.test(request) &&
	!rawRE.test(request) && inlineRE.test(request);
