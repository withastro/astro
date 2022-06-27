import sharp from 'sharp';
import { isAspectRatioString, isOutputFormat } from '../utils.js';
import type { TransformOptions, OutputFormat, SSRImageService } from '../types';

class SharpService implements SSRImageService {	
	async getImageAttributes(props: TransformOptions) {
		const { width, height } = props;
	
		return {
			width: width,
			height: height
		}
	}

	serializeImageProps(props: TransformOptions) {
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
			searchParams.append('ar', props.aspectRatio.toString());
		}
	
		searchParams.append('href', props.src);
	
		return { searchParams };
	}

	parseImageProps(searchParams: URLSearchParams) {
		if (!searchParams.has('href')) {
			return undefined;
		}
	
		let props: TransformOptions = { src: searchParams.get('href')! };

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
	
		if (searchParams.has('ar')) {
			const ratio = searchParams.get('ar')!;
	
			if (isAspectRatioString(ratio)) {
				props.aspectRatio = ratio;
			} else {
				props.aspectRatio = parseFloat(ratio);
			}
		}
	
		return props;
	}

	async transform(inputBuffer: Buffer, props: TransformOptions) {
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
