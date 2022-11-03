import type { HostedImageService, TransformOptions } from "@astrojs/image/dist/loaders";

export interface MyServiceTransformOptions extends TransformOptions {

}

class HostedService implements HostedImageService<MyServiceTransformOptions> {
	async getImageAttributes(transform: MyServiceTransformOptions): Promise<astroHTML.JSX.ImgHTMLAttributes> {
		const url = new URL(`https://example.com/image`)
		url.searchParams.set('href', transform.src)

		if (transform.width) {
			url.searchParams.set('w', transform.width.toString())
		}
		if (transform.height) {
			url.searchParams.set('h', transform.height.toString())
		}

		return {
			src: url.toString(),
			class: 'hosted-img'
		}
	}
}

const service = new HostedService()

export default service
