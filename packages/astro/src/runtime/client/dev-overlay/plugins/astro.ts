import type { DevOverlayItem } from '../../../../@types/astro.js';
import type { DevOverlayWindow } from '../ui-toolkit.js';
import astroIcon from './astro.svg.js';

export default {
	id: 'astro',
	name: 'Astro',
	icon: astroIcon,
	init(canvas) {
		const astroWindow = document.createElement('astro-dev-overlay-window') as DevOverlayWindow;

		canvas.appendChild(astroWindow);
	},
} satisfies DevOverlayItem;
