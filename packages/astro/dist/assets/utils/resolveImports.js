import { isRemotePath, removeBase } from '@astrojs/internal-helpers/path';
import { CONTENT_IMAGE_FLAG, IMAGE_IMPORT_PREFIX } from '../../content/consts.js';
import { shorthash } from '../../runtime/server/shorthash.js';
import { VALID_INPUT_FORMATS } from '../consts.js';
function imageSrcToImportId(imageSrc, filePath) {
	imageSrc = removeBase(imageSrc, IMAGE_IMPORT_PREFIX);
	if (isRemotePath(imageSrc)) {
		return;
	}
	const ext = imageSrc.split('.').at(-1)?.toLowerCase();
	if (!ext || !VALID_INPUT_FORMATS.includes(ext)) {
		return;
	}
	const params = new URLSearchParams(CONTENT_IMAGE_FLAG);
	if (filePath) {
		params.set('importer', filePath);
	}
	return `${imageSrc}?${params.toString()}`;
}
const importIdToSymbolName = (importId) => `__ASTRO_IMAGE_IMPORT_${shorthash(importId)}`;
export { imageSrcToImportId, importIdToSymbolName };
