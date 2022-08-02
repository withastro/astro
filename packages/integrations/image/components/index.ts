/// <reference types="astro/astro-jsx" />
export { default as Image } from './Image.astro';
export { default as Picture } from './Picture.astro';

// TODO: should these directives be removed from astroHTML.JSX?
export type ImgHTMLAttributes = Omit<
	astroHTML.JSX.ImgHTMLAttributes,
	'client:list' | 'set:text' | 'set:html' | 'is:raw'
>;
export type HTMLAttributes = Omit<
	astroHTML.JSX.HTMLAttributes,
	'client:list' | 'set:text' | 'set:html' | 'is:raw'
>;
