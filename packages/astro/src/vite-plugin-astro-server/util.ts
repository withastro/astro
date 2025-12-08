import { isCSSRequest } from 'vite';

const rawRE = /(?:\?|&)raw(?:&|$)/;
const inlineRE = /(?:\?|&)inline\b/;

export const isBuildableCSSRequest = (request: string): boolean =>
	isCSSRequest(request) && !rawRE.test(request) && !inlineRE.test(request);
