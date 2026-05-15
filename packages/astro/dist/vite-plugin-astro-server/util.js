import { isCSSRequest } from 'vite';
const rawRE = /(?:\?|&)raw(?:&|$)/;
const inlineRE = /(?:\?|&)inline\b/;
const isBuildableCSSRequest = (request) =>
	isCSSRequest(request) && !rawRE.test(request) && !inlineRE.test(request);
export { inlineRE, isBuildableCSSRequest, rawRE };
