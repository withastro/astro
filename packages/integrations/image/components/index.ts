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

let altWarningShown = false;

export function warnForMissingAlt() {
	if (altWarningShown === true) {
		return;
	}

	altWarningShown = true;

	console.warn(`\n[@astrojs/image] "alt" text was not provided for an <Image> or <Picture> component.

A future release of @astrojs/image may throw a build error when "alt" text is missing.

The "alt" attribute holds a text description of the image, which isn't mandatory but is incredibly useful for accessibility. Set to an empty string (alt="") if the image is not a key part of the content (it's decoration or a tracking pixel).\n`);
}
