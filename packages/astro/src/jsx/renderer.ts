import type { AstroRenderer } from '../@types/astro.js';
import { jsxTransformOptions } from './transform-options.js';

const renderer: AstroRenderer = {
	name: 'astro:jsx',
	serverEntrypoint: 'astro/jsx/server.js',
	jsxImportSource: 'astro',
	jsxTransformOptions,
};

export default renderer;
