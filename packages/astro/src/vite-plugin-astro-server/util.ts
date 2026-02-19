import { isCSSRequest } from 'vite';

export const rawRE = /(?:\?|&)raw(?:&|$)/;
export const inlineRE = /(?:\?|&)inline\b/;

export const isBuildableCSSRequest = (request: string): boolean =>
	isCSSRequest(request) && !rawRE.test(request) && !inlineRE.test(request);
