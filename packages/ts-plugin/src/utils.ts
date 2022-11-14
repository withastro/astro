export function isAstroFilePath(filePath: string) {
	return filePath.endsWith('.astro');
}

export function isVirtualAstroFilePath(filePath: string) {
	return filePath.endsWith('.astro.ts');
}

export function toRealAstroFilePath(filePath: string) {
	return filePath.slice(0, -'.ts'.length);
}

export function ensureRealAstroFilePath(filePath: string) {
	return isVirtualAstroFilePath(filePath) ? toRealAstroFilePath(filePath) : filePath;
}

export function isNotNullOrUndefined<T>(val: T | undefined | null): val is T {
	return val !== undefined && val !== null;
}

/**
 * Replace all occurrences of a string within an object with another string,
 */
export function replaceDeep<T extends Record<string, any>>(
	obj: T,
	searchStr: string | RegExp,
	replacementStr: string
): T {
	return _replaceDeep(obj);

	function _replaceDeep(_obj: any): any {
		if (typeof _obj === 'string') {
			return _obj.replace(searchStr, replacementStr);
		}
		if (Array.isArray(_obj)) {
			return _obj.map((entry) => _replaceDeep(entry));
		}
		if (typeof _obj === 'object') {
			return Object.keys(_obj).reduce((_o, key) => {
				_o[key] = _replaceDeep(_obj[key]);
				return _o;
			}, {} as any);
		}
		return _obj;
	}
}

export function getConfigPathForProject(project: ts.server.Project) {
	return (
		(project as ts.server.ConfiguredProject).canonicalConfigFilePath ??
		(project.getCompilerOptions() as any).configFilePath
	);
}

export function readProjectAstroFilesFromFs(
	ts: typeof import('typescript/lib/tsserverlibrary'),
	project: ts.server.Project,
	parsedCommandLine: ts.ParsedCommandLine
) {
	const fileSpec: TsFilesSpec = parsedCommandLine.raw;
	const { include, exclude } = fileSpec;

	if (include?.length === 0) {
		return [];
	}

	return ts.sys
		.readDirectory(project.getCurrentDirectory() || process.cwd(), ['.astro'], exclude, include)
		.map(ts.server.toNormalizedPath);
}

export interface TsFilesSpec {
	include?: readonly string[];
	exclude?: readonly string[];
}
