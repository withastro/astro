import { AstroError, AstroErrorData } from '../../core/errors/index.js';

import type { ScanStrategyHandler } from './types'

// Support quoted values to allow statically known `import.meta.env` variables to be used
function isQuoted(value: string) {
	return (value[0] === '"' || value[0] === "'") && value[value.length - 1] === value[0];
}

function isTruthy(value: string) {
	if (isQuoted(value)) {
		value = value.slice(1, -1);
	}
	return value === 'true' || value === '1';
}

function isFalsy(value: string) {
	if (isQuoted(value)) {
		value = value.slice(1, -1);
	}
	return value === 'false' || value === '0';
}
export const booleanStrategyHandler: ScanStrategyHandler<boolean> = ({
  code,
  name,
  endOfLocalName,
}) => {
  // For a given export, check the value of the local declaration
  // Basically extract the `const` from the statement `export const prerender = true`
  const prefix = code
    .slice(0, endOfLocalName)
    .split('export')
    .pop()!
    .trim()
    .replace(name, '')
    .trim()
  // For a given export, check the value of the first non-whitespace token.
  // Basically extract the `true` from the statement `export const prerender = true`
  const suffix = code
    .slice(endOfLocalName)
    .trim()
    .replace(/\=/, '')
    .trim()
    .split(/[;\n]/)[0]
  if (prefix !== 'const' || !(isTruthy(suffix) || isFalsy(suffix))) {
    throw new AstroError({
      ...AstroErrorData.InvalidPrerenderExport,
      message: AstroErrorData.InvalidPrerenderExport.message(
        prefix,
        suffix,
        isHybridOutput
      ),
      location: { file: id },
    })
  }

  return isTruthy(suffix)
}
