import type { HostedImageService, TransformOptions } from "../types";

export class Cloudinary implements HostedImageService {
	async getImageAttributes(transform: TransformOptions): Promise<astroHTML.JSX.ImgHTMLAttributes> {
		const { width, height, src, format, quality, aspectRatio, ...rest } = transform;

		const url = `https://res.cloudinary.com/demo/image/upload/c_crop,g_face,h_400,w_400/r_max/c_scale,w_200/lady.jpg`;

		return {
			...rest,
			src: url
		};
	}
}

const service = new Cloudinary();

export default service;
