import type { ImageLayout } from './types.js';
export declare const DEFAULT_RESOLUTIONS: number[];
export declare const LIMITED_RESOLUTIONS: number[];
/**
 * Gets the breakpoints for an image, based on the layout and width
 *
 * The rules are as follows:
 *
 * - For full-width layout we return all breakpoints smaller than the original image width
 * - For fixed layout we return 1x and 2x the requested width, unless the original image is smaller than that.
 * - For responsive layout we return all breakpoints smaller than 2x the requested width, unless the original image is smaller than that.
 */
export declare const getWidths: ({
	width,
	layout,
	breakpoints,
	originalWidth,
}: {
	width?: number;
	layout: ImageLayout;
	breakpoints?: Array<number>;
	originalWidth?: number;
}) => Array<number>;
/**
 * Gets the `sizes` attribute for an image, based on the layout and width
 */
export declare const getSizesAttribute: ({
	width,
	layout,
}: {
	width?: number;
	layout?: ImageLayout;
}) => string | undefined;
