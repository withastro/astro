import type { SSRResult } from '../../../types/public/internal.js';
/**
 * Emitted by the compiler when entering an HTML `<template>` element.
 */
export declare function templateEnter(_result: SSRResult): {
	type: 'template-enter';
};
/**
 * Emitted by the compiler when exiting an HTML `<template>` element.
 */
export declare function templateExit(_result: SSRResult): {
	type: 'template-exit';
};
