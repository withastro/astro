export function isOutputFormat(value: string): value is OutputFormat {
	return ['avif', 'jpeg', 'png', 'webp'].includes(value);
}

export function isAspectRatioString(value: string): value is `${number}:${number}` {
	return /^\d*:\d*$/.test(value);
}

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

export interface RemoteImageService {
	toImageSrc(props: ImageProps): Promise<ImageAttributes['src']>;
	parseImageSrc(src: ImageAttributes['src']): ImageProps | undefined;
}

export interface LocalImageService extends RemoteImageService {
	toBuffer(inputBuffer: Buffer, props: ImageProps): Promise<Buffer>;
}
