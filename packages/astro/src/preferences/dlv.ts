export default function dlv(obj: Record<string, unknown>, key: string): any {
	for (const k of key.split('.')) {
		// @ts-expect-error: Type 'unknown' is not assignable to type 'Record<string, unknown>'.
		obj = obj?.[k];
	}
	return obj;
}
