import * as eslexer from 'es-module-lexer';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { PageOptions } from '../vite-plugin-astro/types.js';
import { ScanStrategy, STRATEGIES } from './strategies';

const KNOWN_EXPORTS = new Map<string, ScanStrategy>(
  Object.entries({
    prerender: 'boolean',
    tag: 'string',
  })
)

// Quick scan to determine if code includes recognized export
// False positives are not a problem, so be forgiving!
function includesExport(code: string) {
  for (const name of KNOWN_EXPORTS.keys()) {
    if (code.includes(name)) return true
  }
  return false
}

let didInit = false

export async function scan(
  code: string,
  id: string,
  isHybridOutput = false
): Promise<PageOptions> {
  if (!includesExport(code)) return {}
  if (!didInit) {
    await eslexer.init
    didInit = true
  }

  const [, exports] = eslexer.parse(code, id)
  let pageOptions: PageOptions = {}
  for (const _export of exports) {
    const { n: name, le: endOfLocalName } = _export
    // mark that a `prerender` export was found
    if (KNOWN_EXPORTS.has(name)) {
      const strategy = KNOWN_EXPORTS.get(name)

      pageOptions[name as keyof PageOptions] = STRATEGIES[strategy]({
        code,
        name,
        endOfLocalName,
      })
    }
  }
  return pageOptions
}
