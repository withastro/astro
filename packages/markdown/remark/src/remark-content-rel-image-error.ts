import type { Image } from 'mdast';
import { visit } from 'unist-util-visit';
import { pathToFileURL } from 'url';
import type { VFile } from 'vfile';

/**
 * `src/content/` does not support relative image paths.
 * This plugin throws an error if any are found
 */
export default function toRemarkContentRelImageError({ contentDir }: { contentDir: URL }) {
	return function remarkContentRelImageError() {
		return (tree: any, vfile: VFile) => {
			if (typeof vfile?.path !== 'string') return;

			const isContentFile = pathToFileURL(vfile.path).href.startsWith(contentDir.href);
			if (!isContentFile) return;

			const relImagePaths = new Set<string>();
			visit(tree, 'image', function raiseError(node: Image) {
				if (isRelativePath(node.url)) {
					relImagePaths.add(node.url);
				}
			});
			if (relImagePaths.size === 0) return;

			const errorMessage =
				`Relative image paths are not supported in the content/ directory. Place local images in the public/ directory and use absolute paths (see https://docs.astro.build/en/guides/images/#in-markdown-files)\n` +
				[...relImagePaths].map((path) => JSON.stringify(path)).join(',\n');

			// Throw raw string to use `astro:markdown` default formatting
			throw errorMessage;
		};
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
