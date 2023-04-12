//
import { fileURLToPath, pathToFileURL } from 'node:url'

export function pathify(path: string): string {
  if (path.startsWith('file://')) {
    path = fileURLToPath(path)
  }
  return path
}

export function instantiateEmscriptenWasm<T extends EmscriptenWasm.Module>(
  factory: EmscriptenWasm.ModuleFactory<T>,
  bytes: Uint8Array,
): Promise<T> {
  return factory({
		// @ts-expect-error This is a valid Emscripten option, but the type definitions don't know about it
		wasmBinary: bytes,
		locateFile(file: string) {
			return file
		}
  })
}

export function dirname(url: string) {
	return url.substring(0, url.lastIndexOf('/'))
}

/**
 * On certain serverless hosts, our ESM bundle is transpiled to CJS before being run, which means
 * import.meta.url is undefined, so we'll fall back to __filename in those cases
 * We should be able to remove this once https://github.com/netlify/zip-it-and-ship-it/issues/750 is fixed
 */
export function getModuleURL(url: string | undefined): string {
	if (!url) {
		return pathToFileURL(__filename).toString();
	}

	return url
}
