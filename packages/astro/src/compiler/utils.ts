/** Is the given string a valid component tag */
export function isComponentTag(tag: string) {
  return /^[A-Z]/.test(tag) || /^[a-z]+\./.test(tag);
}
