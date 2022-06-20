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
	outputDir?: string;
	filenameFormat?: FilenameFormatter;
	routePattern?: string;
}

export interface ImageProps {
	src: string;
	format: OutputFormat;
	quality?: number;
	width?: number;
	height?: number;
	aspectRatio?: number | `${number}:${number}`;
}

export type ImageAttributes = Pick<HTMLImageElement, 'src'|'width'|'height'>;

export interface RemoteImageService {
	getImage(props: ImageProps): Promise<ImageAttributes & { searchParams: URLSearchParams }>;
}

export interface LocalImageService extends RemoteImageService {
	parseImageSrc(src: ImageAttributes['src']): ImageProps | undefined;
	toBuffer(inputBuffer: Buffer, props: ImageProps): Promise<{ data: Buffer, format: OutputFormat }>;
}
