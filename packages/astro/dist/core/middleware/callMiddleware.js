import { AstroError, AstroErrorData } from '../errors/index.js';
async function callMiddleware(onRequest, apiContext, responseFunction) {
	let nextCalled = false;
	let responseFunctionPromise = void 0;
	const next = async (payload) => {
		nextCalled = true;
		responseFunctionPromise = responseFunction(apiContext, payload);
		return responseFunctionPromise;
	};
	const middlewarePromise = onRequest(apiContext, next);
	return await Promise.resolve(middlewarePromise).then(async (value) => {
		if (nextCalled) {
			if (typeof value !== 'undefined') {
				if (value instanceof Response === false) {
					throw new AstroError(AstroErrorData.MiddlewareNotAResponse);
				}
				return value;
			} else {
				if (responseFunctionPromise) {
					return responseFunctionPromise;
				} else {
					throw new AstroError(AstroErrorData.MiddlewareNotAResponse);
				}
			}
		} else if (typeof value === 'undefined') {
			throw new AstroError(AstroErrorData.MiddlewareNoDataOrNextCalled);
		} else if (value instanceof Response === false) {
			throw new AstroError(AstroErrorData.MiddlewareNotAResponse);
		} else {
			return value;
		}
	});
}
export { callMiddleware };
