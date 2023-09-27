// extra layer of indirection to stress the esbuild
// @ts-ignore
import mod from './add.wasm?module';

const addModule: any = new WebAssembly.Instance(mod);

export function addImpl(a: number, b: number): number {
	return addModule.exports.add(a, b);
}
