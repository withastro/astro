import colors from 'picocolors';
import type { TextStyler } from '../definitions.js';

export function createTextStyler(): TextStyler {
	return colors;
}
