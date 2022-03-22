import traverse from '@babel/traverse';
import generator from '@babel/generator';

// @ts-ignore @babel/traverse isn't ESM and needs this trick
export const visit = traverse.default as typeof traverse;

// @ts-ignore @babel/generator isn't ESM and needs this trick
export const generate = generator.default as typeof generator;

export * as t from '@babel/types';
export { parse } from '@babel/parser';
export { default as template } from '@babel/parser';
