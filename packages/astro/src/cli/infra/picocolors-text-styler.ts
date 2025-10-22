import colors from 'picocolors';
import type { TextStyler } from '../definitions.js';

export function createPicocolorsTextStyler(): TextStyler {
	return colors;
}
