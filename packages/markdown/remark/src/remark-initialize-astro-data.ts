import type { VFile } from 'vfile';
import type { AstroConfig, MarkdownAstroData } from '../@types/astro';

export function remarkInitializeAstroData() {
	return function (tree: any, vfile: VFile) {
		if (!vfile.data.astro) {
			vfile.data.astro = { frontmatter: {} };
		}
	};
}
