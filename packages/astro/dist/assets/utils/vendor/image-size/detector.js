import { typeHandlers, types } from './types/index.js';
const firstBytes = /* @__PURE__ */ new Map([
	[0, 'heif'],
	[56, 'psd'],
	[66, 'bmp'],
	[68, 'dds'],
	[71, 'gif'],
	[73, 'tiff'],
	[77, 'tiff'],
	[82, 'webp'],
	[105, 'icns'],
	[137, 'png'],
	[255, 'jpg'],
]);
function detector(input) {
	const byte = input[0];
	const type = firstBytes.get(byte);
	if (type && typeHandlers.get(type).validate(input)) {
		return type;
	}
	return types.find((imageType) => typeHandlers.get(imageType).validate(input));
}
export { detector };
