export const SCRIPT_EXTENSIONS = new Set(['.js', '.ts']);

const scriptRe = new RegExp(
	`\\.(${Array.from(SCRIPT_EXTENSIONS)
		.map((s) => s.slice(1))
		.join('|')})($|\\?)`
);
export const isScriptRequest = (request: string): boolean => scriptRe.test(request);
