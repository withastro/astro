import { BaseSSRService, TransformOptions } from '@astrojs/image'

export interface CustomTransformOptions extends TransformOptions {
	blur?: boolean;
}

class CustomImageService extends BaseSSRService<CustomTransformOptions> {
	async getImageAttributes(transform: CustomTransformOptions) {
		const { blur, ...attrs } = await super.getImageAttributes(transform)

		return attrs
	}

	transformToSearchParams(transform: CustomTransformOptions): URLSearchParams {
		const searchParams = super.transformToSearchParams(transform);
		
		if (transform.blur) {
			searchParams.set('blur', '1')
		}

		return searchParams
	}

	parseTransform(searchParams: URLSearchParams): CustomTransformOptions | undefined {
		let transform = super.parseTransform(searchParams) as CustomTransformOptions

		if (searchParams.has('blur')) {
			transform.blur = searchParams.get('blur') === '1'
		}

		return transform
	}

	async transform(inputBuffer: Buffer, transform: CustomTransformOptions) {
		return { data: inputBuffer, format: transform.format! }
	}
}

const service = new CustomImageService()

export default service
