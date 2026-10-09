import { getImage } from 'astro:assets';
import outsideRender from './assets/outsideRender.jpg';

// Renderers load with the prerender bundle, outside of any render.
const image = await getImage({ src: outsideRender, width: 30, format: 'webp' });
(globalThis as any).outsideRenderImage = image.src;

export default {
	name: 'outside-render',
	check: () => false,
	renderToStaticMarkup: () => ({ html: '' }),
};
