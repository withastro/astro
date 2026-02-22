import { PREVIEW_KEY } from '../shared.js';

export function isPreview() {
	return process.env[PREVIEW_KEY] === 'true';
}
