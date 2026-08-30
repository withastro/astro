import type { SSRResult } from '../../../types/public/internal.js';
import { createRenderInstruction } from './instruction.js';

// Stateless, so one shared object saves an allocation per `<template>` boundary.
const TEMPLATE_ENTER = createRenderInstruction({ type: 'template-enter' } as const);
const TEMPLATE_EXIT = createRenderInstruction({ type: 'template-exit' } as const);

/**
 * Emitted by the compiler when entering an HTML `<template>` element.
 */
export function templateEnter(_result: SSRResult) {
	return TEMPLATE_ENTER;
}

/**
 * Emitted by the compiler when exiting an HTML `<template>` element.
 */
export function templateExit(_result: SSRResult) {
	return TEMPLATE_EXIT;
}
