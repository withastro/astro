import { typeHandlers } from './types/index.js';
import { detector } from './detector.js';
function lookup(input) {
	const type = detector(input);
	if (typeof type !== 'undefined') {
		const size = typeHandlers.get(type).calculate(input);
		if (size !== void 0) {
			size.type = size.type ?? type;
			return size;
		}
	}
	throw new TypeError('unsupported file type: ' + type);
}
export { lookup };
