export type OutputFormat =
	| 'avif'
	| 'jpeg'
	| 'png'
	| 'webp';

export type FilenameFormatter = (props: ImageProps) => string;

export interface IntegrationOptions {
	inputDir?: string;
	outputDir?: string;
	formats?: OutputFormat[];
	filenameFormat?: FilenameFormatter;
	routePattern?: string;
}

export interface ImageProps {
	src: string;
	format?: OutputFormat;
	quality?: number;
	width?: number;
	height?: number;
	aspectRatio?: number | `${number}:${number}`;
}

export type ImageAttributes = Pick<HTMLImageElement, 'src'|'width'|'height'>;

export interface ImageService {
	getImageAttributes: (props: ImageProps) => Promise<ImageAttributes>;
	parseImageSrc: (src: ImageAttributes['src']) => ImageAttributes;
	toBuffer?: (props: ImageProps) => Promise<Buffer>;
}
