import type { LocalImageService } from 'astro';
import { baseService } from 'astro/assets';

// Sharp-free build-time image service so the fixture generates optimized assets
// on every CI runner, including the Windows runner where Sharp's native binary
// cannot load.
const service: LocalImageService = {
	...baseService,

	async transform(inputBuffer, transformOptions) {
		return { data: inputBuffer, format: transformOptions.format ?? 'webp' };
	},
};

export default service;
