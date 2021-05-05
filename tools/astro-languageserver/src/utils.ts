import { URI } from 'vscode-uri';
import { Position, Range } from 'vscode-languageserver';
import { Node } from 'vscode-html-languageservice';

/** Normalizes a document URI */
export function normalizeUri(uri: string): string {
  return URI.parse(uri).toString();
}

/** Turns a URL into a normalized FS Path */
export function urlToPath(stringUrl: string): string | null {
  const url = URI.parse(stringUrl);
  if (url.scheme !== 'file') {
    return null;
  }
  return url.fsPath.replace(/\\/g, '/');
}

/** Converts a path to a URL */
export function pathToUrl(path: string) {
  return URI.file(path).toString();
}

/**
 *
 * The language service is case insensitive, and would provide
 * hover info for Svelte components like `Option` which have
 * the same name like a html tag.
 */
export function isPossibleComponent(node: Node): boolean {
  return !!node.tag?.[0].match(/[A-Z]/);
}

/**
 *
 * The language service is case insensitive, and would provide
 * hover info for Svelte components like `Option` which have
 * the same name like a html tag.
 */
export function isPossibleClientComponent(node: Node): boolean {
  return isPossibleComponent(node) && (node.tag?.indexOf(':') ?? -1) > -1;
}

/** Flattens an array */
export function flatten<T>(arr: T[][]): T[] {
  return arr.reduce((all, item) => [...all, ...item], []);
}

/** Clamps a number between min and max */
export function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

/** Checks if a position is inside range */
export function isInRange(positionToTest: Position, range: Range): boolean {
  return isBeforeOrEqualToPosition(range.end, positionToTest) && isBeforeOrEqualToPosition(positionToTest, range.start);
}

/**  */
export function isBeforeOrEqualToPosition(position: Position, positionToTest: Position): boolean {
  return positionToTest.line < position.line || (positionToTest.line === position.line && positionToTest.character <= position.character);
}

/**
 * Debounces a function but cancels previous invocation only if
 * a second function determines it should.
 *
 * @param fn The function with it's argument
 * @param determineIfSame The function which determines if the previous invocation should be canceld or not
 * @param miliseconds Number of miliseconds to debounce
 */
export function debounceSameArg<T>(fn: (arg: T) => void, shouldCancelPrevious: (newArg: T, prevArg?: T) => boolean, miliseconds: number): (arg: T) => void {
  let timeout: any;
  let prevArg: T | undefined;

  return (arg: T) => {
    if (shouldCancelPrevious(arg, prevArg)) {
      clearTimeout(timeout);
    }

    prevArg = arg;
    timeout = setTimeout(() => {
      fn(arg);
      prevArg = undefined;
    }, miliseconds);
  };
}
