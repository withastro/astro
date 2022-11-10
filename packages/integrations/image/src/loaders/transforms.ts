/// <reference types="astro/astro-jsx" />

import { transferableAbortController } from 'util';
import { htmlColorNames, type NamedColor } from '../utils/colornames.js';
import { ImageMetadata } from '../vite-plugin-astro-image.js';

export type InputFormat =
	| 'heic'
	| 'heif'
	| 'avif'
	| 'jpeg'
	| 'jpg'
	| 'png'
	| 'tiff'
	| 'webp'
	| 'gif';

export type OutputFormatSupportsAlpha = 'avif' | 'png' | 'webp';
export type OutputFormat = OutputFormatSupportsAlpha | 'jpeg' | 'jpg';

export type AspectRatio = number | `${number}:${number}`;

export type ColorDefinition =
	| NamedColor
	| `#${string}`
	| `rgb(${number}, ${number}, ${number})`
	| `rgb(${number},${number},${number})`
	| `rgba(${number}, ${number}, ${number}, ${number})`
	| `rgba(${number},${number},${number},${number})`;

export type CropFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

export type CropPosition =
	| 'top'
	| 'right top'
	| 'right'
	| 'right bottom'
	| 'bottom'
	| 'left bottom'
	| 'left'
	| 'left top'
	| 'north'
	| 'northeast'
	| 'east'
	| 'southeast'
	| 'south'
	| 'southwest'
	| 'west'
	| 'northwest'
	| 'center'
	| 'centre'
	| 'cover'
	| 'entropy'
	| 'attention';

export function isOutputFormat(value: string): value is OutputFormat {
	return ['avif', 'jpeg', 'jpg', 'png', 'webp'].includes(value);
}

export function isOutputFormatSupportsAlpha(value: string): value is OutputFormatSupportsAlpha {
	return ['avif', 'png', 'webp'].includes(value);
}

export function isAspectRatioString(value: string): value is `${number}:${number}` {
	return /^\d*:\d*$/.test(value);
}

export function isColor(value: string): value is ColorDefinition {
	return (
		(htmlColorNames as string[]).includes(value.toLowerCase()) ||
		/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value) ||
		/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.test(value)
	);
}

export function parseAspectRatio(aspectRatio?: AspectRatio) {
	if (!aspectRatio) {
		return undefined;
	}

	// parse aspect ratio strings, if required (ex: "16:9")
	if (typeof aspectRatio === 'number') {
		return aspectRatio;
	} else {
		const [width, height] = aspectRatio.split(':');
		return parseInt(width) / parseInt(height);
	}
}

/**
 * Defines the original image and transforms that need to be applied to it.
 */
interface BaseTransform {
	/**
	 * The output format to be used in the optimized image.
	 *
	 * @default undefined The original image format will be used.
	 */
	format?: OutputFormat;
	/**
	 * The compression quality used during optimization.
	 *
	 * @default undefined Allows the image service to determine defaults.
	 */
	quality?: number;
	/**
	 * The background color to use when converting from a transparent image format to a
	 * non-transparent format. This is useful for converting PNGs to JPEGs.
	 *
	 * @example "white" - a named color
	 * @example "#ffffff" - a hex color
	 * @example "rgb(255, 255, 255)" - an rgb color
	 */
	background?: ColorDefinition;
	/**
	 * How the image should be resized to fit both `height` and `width`.
	 *
	 * @default 'cover'
	 */
	fit?: CropFit;
	/**
	 * Position of the crop when fit is `cover` or `contain`.
	 *
	 * @default 'centre'
	 */
	position?: CropPosition;
}

export type AsyncImageMetadata = Promise<{ default: ImageMetadata }>;

interface LocalTransform extends BaseTransform {
	/**
	 * Source for the original image file.
	 *
	 * For images in your project's repository, use the `src` relative to the `public` directory.
	 * For remote images, provide the full URL.
	 */
	src: ImageMetadata | AsyncImageMetadata;
	/**
	 * The desired width of the output image. Combine with `height` to crop the image
	 * to an exact size, or `aspectRatio` to automatically calculate and crop the height.
	 */
	width?: number;
	/**
	 * The desired height of the output image. Combine with `height` to crop the image
	 * to an exact size, or `aspectRatio` to automatically calculate and crop the width.
	 */
	height?: number;
	/**
	 * The desired aspect ratio of the output image. Combine with either `width` or `height`
	 * to automatically calculate and crop the other dimension.
	 *
	 * @example 1.777 - numbers can be used for computed ratios, useful for doing `{width/height}`
	 * @example "16:9" - strings can be used in the format of `{ratioWidth}:{ratioHeight}`.
	 */
	aspectRatio?: AspectRatio;
}

interface BaseRemoteTransform extends BaseTransform {
	/**
	 * Source for the original image file.
	 *
	 * For images in your project's repository, use the `src` relative to the `public` directory.
	 * For remote images, provide the full URL.
	 */
	src: string;
}

interface RemoteCropTransform extends BaseRemoteTransform {
	/**
	 * The desired width of the output image. Combine with `height` to crop the image
	 * to an exact size, or `aspectRatio` to automatically calculate and crop the height.
	 */
	width: number;
	/**
	 * The desired height of the output image. Combine with `height` to crop the image
	 * to an exact size, or `aspectRatio` to automatically calculate and crop the width.
	 */
	height: number;
	aspectRatio: undefined;
}

interface RemoteCropWidthTransform extends BaseRemoteTransform {
	/**
	 * The desired height of the output image. Combine with `height` to crop the image
	 * to an exact size, or `aspectRatio` to automatically calculate and crop the width.
	 */
	height: number;
	/**
	 * The desired aspect ratio of the output image. Combine with either `width` or `height`
	 * to automatically calculate and crop the other dimension.
	 *
	 * @example 1.777 - numbers can be used for computed ratios, useful for doing `{width/height}`
	 * @example "16:9" - strings can be used in the format of `{ratioWidth}:{ratioHeight}`.
	 */
	aspectRatio: AspectRatio;
	width: undefined;
}

interface RemoteCropHeightTransform extends BaseRemoteTransform {
	/**
	 * The desired width of the output image. Combine with `height` to crop the image
	 * to an exact size, or `aspectRatio` to automatically calculate and crop the height.
	 */
	width: number;
	/**
	 * The desired aspect ratio of the output image. Combine with either `width` or `height`
	 * to automatically calculate and crop the other dimension.
	 *
	 * @example 1.777 - numbers can be used for computed ratios, useful for doing `{width/height}`
	 * @example "16:9" - strings can be used in the format of `{ratioWidth}:{ratioHeight}`.
	 */
	 aspectRatio: AspectRatio;
	 height: undefined;
}

export type RemoteTransform = RemoteCropTransform | RemoteCropHeightTransform | RemoteCropWidthTransform;

export type TransformOptions = LocalTransform | RemoteTransform;

export type ImageTransform =
  RemoteTransform
	| Omit<LocalTransform, 'src'> & {
		src: `/^[\/\\]?@astroimage/${string}` | `__ASTRO_IMAGE_ASSET__${string}`
		width: number
		height: number
	};

export function isRemoteTransform(transform: TransformOptions): transform is RemoteTransform {
	return typeof transform.src === 'string';
}
