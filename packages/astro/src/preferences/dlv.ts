export default function dlv(obj: Record<string, unknown>, key: string): any {
  const k = key.split('.');
  for (let p = 0; p < k.length; p++) {
    // @ts-expect-error: Type 'unknown' is not assignable to type 'Record<string, unknown>'
    obj = obj ? obj[k[p]] : undefined;
  }
  return obj;
}
