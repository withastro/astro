import type { AstroRenderer } from '../types/public/integrations.js';

const renderer: AstroRenderer = {
	name: 'astro:jsx',
	serverEntrypoint: 'astro/jsx/server.js',
};

export default renderer;
