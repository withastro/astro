import { createImage } from 'astro/content/runtime-assets';

const assetsDir = '@@ASSETS_DIR@@';

export const image = createImage({
	assetsDir,
});
