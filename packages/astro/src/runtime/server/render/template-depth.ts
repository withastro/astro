import type { SSRResult } from '../../../types/public/internal.js';
import { createRenderInstruction } from './instruction.js';

/**
 * Emitted by the compiler when entering an HTML `<template>` element.
 */
export function templateEnter(_result: SSRResult) {
	return createRenderInstruction({ type: 'template-enter' });
}

/**
 * Emitted by the compiler when exiting an HTML `<template>` element.
 */
export function templateExit(_result: SSRResult) {
	return createRenderInstruction({ type: 'template-exit' });
}
