import type { VFile } from 'vfile';

export default function remarkInitializeAstroExports() {
	return function (tree: any, vfile: VFile) {
		if (!vfile.data.astroExports) {
			vfile.data.astroExports = {};
		}
	};
}
