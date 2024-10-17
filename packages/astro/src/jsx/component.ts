import { __astro_tag_component__ } from '../runtime/server/index.js';
import renderer from './renderer.js';

const ASTRO_JSX_RENDERER_NAME = renderer.name;

export function createAstroJSXComponent(factory: (...args: any[]) => any) {
	__astro_tag_component__(factory, ASTRO_JSX_RENDERER_NAME);
	return factory;
}
