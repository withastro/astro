// The `ts-expect-error` comments here are necessary because we're importing this file inside the `astro:components`
// virtual module's types, which means that `tsc` will try to resolve these imports. Don't mind the editor errors.
// @ts-expect-error
export { default as Code } from './Code.astro';
// @ts-expect-error
export { default as Debug } from './Debug.astro';
