import { readUInt16LE } from './utils.js';
const TYPE_ICON = 1;
const SIZE_HEADER = 2 + 2 + 2;
const SIZE_IMAGE_ENTRY = 1 + 1 + 1 + 1 + 2 + 2 + 4 + 4;
function getSizeFromOffset(input, offset) {
	const value = input[offset];
	return value === 0 ? 256 : value;
}
function getImageSize(input, imageIndex) {
	const offset = SIZE_HEADER + imageIndex * SIZE_IMAGE_ENTRY;
	return {
		height: getSizeFromOffset(input, offset + 1),
		width: getSizeFromOffset(input, offset),
	};
}
const ICO = {
	validate(input) {
		const reserved = readUInt16LE(input, 0);
		const imageCount = readUInt16LE(input, 4);
		if (reserved !== 0 || imageCount === 0) return false;
		const imageType = readUInt16LE(input, 2);
		return imageType === TYPE_ICON;
	},
	calculate(input) {
		const nbImages = readUInt16LE(input, 4);
		const imageSize = getImageSize(input, 0);
		if (nbImages === 1) return imageSize;
		const images = [];
		for (let imageIndex = 0; imageIndex < nbImages; imageIndex += 1) {
			images.push(getImageSize(input, imageIndex));
		}
		return {
			width: imageSize.width,
			height: imageSize.height,
			images,
		};
	},
};
export { ICO };
