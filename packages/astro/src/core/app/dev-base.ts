import { joinPaths } from '@astrojs/internal-helpers/path';

export function getDevServerBase(base: string, viteBase?: string): string {
	if (!viteBase) return base;

	const viteBasePath = new URL(viteBase, 'http://localhost').pathname;
	return base === '/' ? viteBasePath : joinPaths(base, viteBasePath);
}

export function prependDevServerBase(base: string, pathname: string): string {
	return base === '/' ? pathname : joinPaths(base, pathname);
}
