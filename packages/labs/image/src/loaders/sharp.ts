import sharp from 'sharp';
import { ImageMetadata, isAspectRatioString, isOutputFormat } from '../types.js';
import type { ImageProps, OutputFormat, SSRImageService } from '../types.js';

class SharpService implements SSRImageService {
	async getImageMetadata(pathname: string) {
		try {
			const image = sharp(pathname);
			const metadata = await image.metadata();

			if (!metadata || !metadata.width || !metadata.height || !metadata.format) {
				return undefined;
			}

			return {
				width: metadata.width!,
				height: metadata.height!,
				format: metadata.format!
			}
		} catch (err) {
			console.error(err);
			return undefined;
		}
	}
	
	async getImageAttributes(props: ImageProps) {
		const { width, height } = props;
	
		return {
			width: width,
			height: height
		}
	}

	serializeImageProps(props: ImageProps) {
		const searchParams = new URLSearchParams();
	
		if (props.quality) {
			searchParams.append('q', props.quality.toString());
		}
	
		if (props.format) {
			searchParams.append('f', props.format);
		}
	
		if (props.width) {
			searchParams.append('w', props.width.toString());
		}
	
		if (props.height) {
			searchParams.append('h', props.height.toString());
		}
	
		if (props.aspectRatio) {
			searchParams.append('ratio', props.aspectRatio.toString());
		}
	
		searchParams.append('href', props.src);
	
		return { searchParams };
	}

	parseImageProps(searchParams: URLSearchParams) {
		if (!searchParams.has('href')) {
			return undefined;
		}
	
		let props: ImageProps = { src: searchParams.get('href')! };

		if (searchParams.has('q')) {
			props.quality = parseInt(searchParams.get('q')!);
		}
	
		if (searchParams.has('f')) {
			const format = searchParams.get('f')!;
			if (isOutputFormat(format)) {
				props.format = format;
			}
		}
	
		if (searchParams.has('w')) {
			props.width = parseInt(searchParams.get('w')!);
		}
	
		if (searchParams.has('h')) {
			props.height = parseInt(searchParams.get('h')!);
		}
	
		if (searchParams.has('ratio')) {
			const ratio = searchParams.get('ratio')!;
	
			if (isAspectRatioString(ratio)) {
				props.aspectRatio = ratio;
			} else {
				props.aspectRatio = parseFloat(ratio);
			}
		}
	
		return props;
	}

	async transform(inputBuffer: Buffer, props: ImageProps) {
		const sharpImage = sharp(inputBuffer, { failOnError: false });
	
		if (props.width || props.height) {
			sharpImage.resize(props.width, props.height);
		}
	
		if (props.format) {
			sharpImage.toFormat(props.format, { quality: props.quality });
		}
	
		const { data, info } = await sharpImage.toBuffer({ resolveWithObject: true });
	
		return {
			data,
			format: info.format as OutputFormat,
		};
	}
}

const service = new SharpService();

export default service;
