import { AstroError, AstroErrorData } from '../errors/index.js';
function getRedirectLocationOrThrow(headers) {
	let location = headers.get('location');
	if (!location) {
		throw new AstroError({
			...AstroErrorData.RedirectWithNoLocation,
		});
	}
	return location;
}
export { getRedirectLocationOrThrow };
