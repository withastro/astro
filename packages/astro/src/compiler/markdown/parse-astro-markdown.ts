/** Returns file contents as Astro Markdown. */
export function parseAstroMarkdown(contents: string) {
  let astroYamlCode: number[] = [];
  let astroMarkdown = { data: '', content: '' };

  // if the file begins with a yaml separator
  if (isYamlSeparator(contents, 0)) {
    // collect all contents before the next yaml separator
    for (let i = 3; i < contents.length; ++i) {
      const code = contents.charCodeAt(i);

      // if the next line begins with a yaml separator
      if (isLineFeed(code) && isYamlSeparator(contents, i + 1)) {
        // the remaining contents are the markdown content
        astroMarkdown.content = contents.slice(i + 4);

        break;
      }

      // all other contents are the astro data
      astroYamlCode.push(code);
    }
  }

  astroMarkdown.data = String.fromCharCode(...astroYamlCode);

  return astroMarkdown;
}

/** Returns whether the character code is a line feed or carriage return. */
const isLineFeed = (code: number) => code === 0x000a || code === 0x000d;

/** Returns whether the character code is a hypen-minus. */
const isHypenMinus = (code: number) => code === 0x002d;

/** Returns whether the character indexes form a yaml separator. */
const isYamlSeparator = (contents: string, index: number) =>
  isHypenMinus(contents.charCodeAt(index)) && isHypenMinus(contents.charCodeAt(index + 1)) && isHypenMinus(contents.charCodeAt(index + 2));
