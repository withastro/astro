import type { VFile } from 'vfile';

export function toRemarkInitializeAstroData({
	userFrontmatter,
}: {
	userFrontmatter: Record<string, any>;
}) {
	return () =>
		function (tree: any, vfile: VFile) {
			if (!vfile.data.astro) {
				vfile.data.astro = { frontmatter: userFrontmatter };
			}
		};
}
