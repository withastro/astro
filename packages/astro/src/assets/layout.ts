import type { ImageLayout } from '../types/public/index.js';

// Common screen widths. These will be filtered according to the image size and layout
export const DEFAULT_RESOLUTIONS = [
	640, // older and lower-end phones
	750, // iPhone 6-8
	828, // iPhone XR/11
	960, // older horizontal phones
	1080, // iPhone 6-8 Plus
	1280, // 720p
	1668, // Various iPads
	1920, // 1080p
	2048, // QXGA
	2560, // WQXGA
	3200, // QHD+
	3840, // 4K
	4480, // 4.5K
	5120, // 5K
	6016, // 6K
];

// A more limited set of screen widths, for statically generated images
export const LIMITED_RESOLUTIONS = [
	640, // older and lower-end phones
	750, // iPhone 6-8
	828, // iPhone XR/11
	1080, // iPhone 6-8 Plus
	1280, // 720p
	1668, // Various iPads
	2048, // QXGA
	2560, // WQXGA
];

/**
 * Gets the breakpoints for an image, based on the layout and width
 */
export const getWidths = ({
	width,
	layout,
	breakpoints = DEFAULT_RESOLUTIONS,
	originalWidth,
}: {
	width?: number;
	layout: ImageLayout;
	breakpoints?: Array<number>;
	originalWidth?: number;
}): Array<number> => {
	const smallerThanOriginal = (w: number) => !originalWidth || w <= originalWidth;
	if (layout === 'full-width') {
		return breakpoints.filter(smallerThanOriginal);
	}
	if (!width) {
		return [];
	}
	const doubleWidth = width * 2;
	const maxSize = originalWidth ? Math.min(doubleWidth, originalWidth) : doubleWidth;
	if (layout === 'fixed') {
		// If the image is larger than the original, only include the original width
		// Otherwise, include the image width and the double-resolution width, unless the double-resolution width is larger than the original
		return originalWidth && width > originalWidth ? [originalWidth] : [width, maxSize];
	}
	if (layout === 'responsive') {
		return (
			[
				// Always include the image at 1x and 2x the specified width
				width,
				doubleWidth,
				...breakpoints,
			]
				// Sort the resolutions in ascending order
				.sort((a, b) => a - b)
				// Filter out any resolutions that are larger than the double-resolution image or source image
				.filter((w) => w <= maxSize)
		);
	}

	return [];
};

/**
 * Gets the `sizes` attribute for an image, based on the layout and width
 */
export const getSizesAttribute = ({
	width,
	layout,
}: { width?: number; layout?: ImageLayout }): string | undefined => {
	if (!width || !layout) {
		return undefined;
	}
	switch (layout) {
		// If screen is wider than the max size then image width is the max size,
		// otherwise it's the width of the screen
		case `responsive`:
			return `(min-width: ${width}px) ${width}px, 100vw`;

		// Image is always the same width, whatever the size of the screen
		case `fixed`:
			return `${width}px`;

		// Image is always the width of the screen
		case `full-width`:
			return `100vw`;

		case 'none':
		default:
			return undefined;
	}
};
