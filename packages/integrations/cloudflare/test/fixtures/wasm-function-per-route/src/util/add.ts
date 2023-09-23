// extra layer of indirection to stress the esbuild
import { addImpl } from "./indirection";

export function add(a: number, b: number): number {
	return addImpl(a, b);
}
