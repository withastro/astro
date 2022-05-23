import type ts from 'typescript/lib/tsserverlibrary';

export function isSvelteFilePath(filePath: string) {
    return filePath.endsWith('.svelte');
}

export function isVirtualSvelteFilePath(filePath: string) {
    return filePath.endsWith('.svelte.ts');
}

export function toRealSvelteFilePath(filePath: string) {
    return filePath.slice(0, -'.ts'.length);
}

export function ensureRealSvelteFilePath(filePath: string) {
    return isVirtualSvelteFilePath(filePath) ? toRealSvelteFilePath(filePath) : filePath;
}

export function isNotNullOrUndefined<T>(val: T | undefined | null): val is T {
    return val !== undefined && val !== null;
}

/**
 * Checks if this a section that should be completely ignored
 * because it's purely generated.
 */
export function isInGeneratedCode(text: string, start: number, end: number) {
    const lineStart = text.lastIndexOf('\n', start);
    const lineEnd = text.indexOf('\n', end);
    const lastStart = text.substring(lineStart, start).lastIndexOf('/*Ωignore_startΩ*/');
    const lastEnd = text.substring(lineStart, start).lastIndexOf('/*Ωignore_endΩ*/');
    return lastStart > lastEnd && text.substring(end, lineEnd).includes('/*Ωignore_endΩ*/');
}

/**
 * Checks that this isn't a text span that should be completely ignored
 * because it's purely generated.
 */
export function isNoTextSpanInGeneratedCode(text: string, span: ts.TextSpan) {
    return !isInGeneratedCode(text, span.start, span.start + span.length);
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
