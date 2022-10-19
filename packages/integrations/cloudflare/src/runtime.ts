
export function getRuntime(request: Request): any {
  return Reflect.get(
    request,
    Symbol.for('runtime')
  );
}