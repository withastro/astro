/**
 * Module to generate global stylesheet
 */

export const STYLESHEET_URL = `/_astro/stylesheet.css`; // can be anything, as long as it’s unique

export type StylesheetCollection = Map<string, string>;

export function devStyles(styleCollection: StylesheetCollection): string {
  // TODO: combine map into string
  return `body{font-family:system-ui, sans-serif;}`;
}

export function buildStyles(styleCollection: StylesheetCollection): string {
  // TODO: combine map into string, minify, optimize
  return `body{font-family:system-ui, sans-serif;}`;
}
