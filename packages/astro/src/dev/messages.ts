/**
 * Dev server messages (organized here to prevent clutter)
 */

import * as colors from 'kleur/colors';
import { pad } from './util.js';

/** Display  */
export function req({ url, statusCode, reqTime }: { url: string; statusCode: number; reqTime: number }): string {
  let style = colors.dim;
  if (statusCode >= 500) style = colors.magenta;
  else if (statusCode >= 400) style = colors.yellow;
  else if (statusCode >= 300) style = colors.dim;
  else if (statusCode >= 200) style = colors.green;
  return `${style(statusCode)} ${pad(url, 40)} ${colors.dim(Math.round(reqTime) + 'ms')}`;
}

/** Display  */
export function reload({ url, reqTime }: { url: string; reqTime: number }): string {
  return `${pad(url, 40)} ${colors.dim(Math.round(reqTime) + 'ms')}`;
}

/** Display dev server host and startup time */
export function devStart({ startupTime }: { startupTime: number }): string {
  return `${pad(`Server started`, 44)} ${colors.dim(`${Math.round(startupTime)}ms`)}`;
}

/** Display dev server host */
export function devHost({ host }: { host: string }): string {
  return `Local: ${colors.bold(colors.magenta(host))}`;
}

/** Display port in use */
export function portInUse({ port }: { port: number }): string {
  return `Port ${port} in use. Trying a new one…`;
}
