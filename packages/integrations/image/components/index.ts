/// <reference types="astro/astro-jsx" />
export { default as Image } from './Image.astro';
export { default as Picture } from './Picture.astro';
import type { HTMLAttributes } from 'astro/types';

import type { TransformOptions, OutputFormat } from '../dist/loaders/index.js';
import type { ImageMetadata } from '../dist/vite-plugin-astro-image.js';
import type { AstroBuiltinAttributes } from 'astro';

export interface ImageComponentLocalImageProps
	extends Omit<TransformOptions, 'src'>,
		Omit<ImgHTMLAttributes, 'src' | 'width' | 'height'> {
	src: ImageMetadata | Promise<{ default: ImageMetadata }>;
	/** Defines an alternative text description of the image. Set to an empty string (alt="") if the image is not a key part of the content (it's decoration or a tracking pixel). */
	alt: string;
}

export interface ImageComponentRemoteImageProps extends TransformOptions, ImgHTMLAttributes {
	src: string;
	/** Defines an alternative text description of the image. Set to an empty string (alt="") if the image is not a key part of the content (it's decoration or a tracking pixel). */
	alt: string;
	format?: OutputFormat;
	width: number;
	height: number;
}

export interface PictureComponentLocalImageProps
	extends GlobalHTMLAttributes,
		Omit<TransformOptions, 'src'>,
		Pick<ImgHTMLAttributes, 'loading' | 'decoding'> {
	src: ImageMetadata | Promise<{ default: ImageMetadata }>;
	/** Defines an alternative text description of the image. Set to an empty string (alt="") if the image is not a key part of the content (it's decoration or a tracking pixel). */
	alt: string;
	widths: number[];
	sizes?: HTMLImageElement['sizes'];
	formats?: OutputFormat[];
}

export interface PictureComponentRemoteImageProps
	extends GlobalHTMLAttributes,
		TransformOptions,
		Pick<ImgHTMLAttributes, 'loading' | 'decoding'> {
	src: string;
	/** Defines an alternative text description of the image. Set to an empty string (alt="") if the image is not a key part of the content (it's decoration or a tracking pixel). */
	alt: string;
	widths: number[];
	aspectRatio: TransformOptions['aspectRatio'];
	sizes?: HTMLImageElement['sizes'];
	formats?: OutputFormat[];
	background?: TransformOptions['background'];
}

export type ImgHTMLAttributes = HTMLAttributes<'img'>;

export type GlobalHTMLAttributes = Omit<
	astroHTML.JSX.HTMLAttributes,
	keyof Omit<AstroBuiltinAttributes, 'class:list'>
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
