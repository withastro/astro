export default function dlv(obj: Record<string, any>, key: string): any {
	return key.split('.').reduce((acc, k) => acc?.[k], obj);
}
