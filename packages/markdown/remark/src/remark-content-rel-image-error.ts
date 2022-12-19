import type { Image } from 'mdast';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

//
export default function remarkContentRelImageError() {
	return (tree: any, vfile: VFile) => {
		if (!vfile.path.includes('content/')) return;

		const relImagePaths = new Set<string>();
		visit(tree, 'image', function raiseError(node: Image) {
			if (isRelativePath(node.url)) {
				relImagePaths.add(node.url);
			}
		});
		if (relImagePaths.size === 0) return;

		const errorMessage =
			`Relative image paths are not support in the content/ directory. Please update to absolute paths:\n` +
			[...relImagePaths].map((path) => JSON.stringify(path)).join(',\n');

		// Throw raw string to use `astro:markdown` default formatting
		throw errorMessage;
	};
}

// Following utils taken from `packages/astro/src/core/path.ts`:

function isRelativePath(path: string) {
	return startsWithDotDotSlash(path) || startsWithDotSlash(path);
}

function startsWithDotDotSlash(path: string) {
	const c1 = path[0];
	const c2 = path[1];
	const c3 = path[2];
	return c1 === '.' && c2 === '.' && c3 === '/';
}

function startsWithDotSlash(path: string) {
	const c1 = path[0];
	const c2 = path[1];
	return c1 === '.' && c2 === '/';
}
