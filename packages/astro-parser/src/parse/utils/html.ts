// based on http://developers.whatwg.org/syntax.html#syntax-tag-omission
const disallowed_contents = new Map([
  ['li', new Set(['li'])],
  ['dt', new Set(['dt', 'dd'])],
  ['dd', new Set(['dt', 'dd'])],
  ['p', new Set('address article aside blockquote div dl fieldset footer form h1 h2 h3 h4 h5 h6 header hgroup hr main menu nav ol p pre section table ul'.split(' '))],
  ['rt', new Set(['rt', 'rp'])],
  ['rp', new Set(['rt', 'rp'])],
  ['optgroup', new Set(['optgroup'])],
  ['option', new Set(['option', 'optgroup'])],
  ['thead', new Set(['tbody', 'tfoot'])],
  ['tbody', new Set(['tbody', 'tfoot'])],
  ['tfoot', new Set(['tbody'])],
  ['tr', new Set(['tr', 'tbody'])],
  ['td', new Set(['td', 'th', 'tr'])],
  ['th', new Set(['td', 'th', 'tr'])],
]);

// can this be a child of the parent element, or does it implicitly
// close it, like `<li>one<li>two`?
export function closing_tag_omitted(current: string, next?: string) {
  if (disallowed_contents.has(current)) {
    if (!next || disallowed_contents.get(current)!.has(next)) {
      return true;
    }
  }

  return false;
}
