import { SvelteDocument } from '../SvelteDocument';

/**
 * Special svelte syntax tags that do template logic.
 */
export type SvelteLogicTag = 'each' | 'if' | 'await' | 'key';

/**
 * Special svelte syntax tags.
 */
export type SvelteTag = SvelteLogicTag | 'html' | 'debug' | 'const';

/**
 * For each tag, a documentation in markdown format.
 */
export const documentation = {
    await:
        `\`{#await ...}\`\\
Await blocks allow you to branch on the three possible states of a Promise — pending, ` +
        `fulfilled or rejected.
#### Usage:
\`{#await expression}...{:then name}...{:catch name}...{/await}\`\\
\`{#await expression}...{:then name}...{/await}\`\\
\`{#await expression then name}...{/await}\`\\
\\
https://svelte.dev/docs#await
`,
    each: `\`{#each ...}\`\\
Iterating over lists of values can be done with an each block.
#### Usage:
\`{#each expression as name}...{/each}\`\\
\`{#each expression as name, index}...{/each}\`\\
\`{#each expression as name, index (key)}...{/each}\`\\
\`{#each expression as name}...{:else}...{/each}\`\\
\\
https://svelte.dev/docs#each
`,
    if: `\`{#if ...}\`\\
Content that is conditionally rendered can be wrapped in an if block.
#### Usage:
\`{#if expression}...{/if}\`\\
\`{#if expression}...{:else if expression}...{/if}\`\\
\`{#if expression}...{:else}...{/if}\`\\
\\
https://svelte.dev/docs#if
`,
    key: `\`{#key expression}...{/key}\`\\
Key blocks destroy and recreate their contents when the value of an expression changes.\\
This is useful if you want an element to play its transition whenever a value changes.\\
When used around components, this will cause them to be reinstantiated and reinitialised.
#### Usage:
\`{#key expression}...{/key}\`\\
\\
https://svelte.dev/docs#key
`,
    html:
        `\`{@html ...}\`\\
In a text expression, characters like < and > are escaped; however, ` +
        `with HTML expressions, they're not.
The expression should be valid standalone HTML.
#### Caution
Svelte does not sanitize expressions before injecting HTML.
If the data comes from an untrusted source, you must sanitize it, ` +
        `or you are exposing your users to an XSS vulnerability.
#### Usage:
\`{@html expression}\`\\
\\
https://svelte.dev/docs#html
`,
    debug:
        `\`{@debug ...}\`\\
Offers an alternative to \`console.log(...)\`.
It logs the values of specific variables whenever they change, ` +
        `and pauses code execution if you have devtools open.
It accepts a comma-separated list of variable names (not arbitrary expressions).
#### Usage:
\`{@debug}\`
\`{@debug var1, var2, ..., varN}\`\\
\\
https://svelte.dev/docs#debug
`,
    const: `\`{@const ...}\`\\
TODO
#### Usage:
\`{@const a = b + c}\`\\
`
};

/**
 * Get the last tag that is opened but not closed.
 */
export function getLatestOpeningTag(
    svelteDoc: SvelteDocument,
    offset: number
): SvelteLogicTag | null {
    // Only use content up to the position and strip out html comments
    const content = svelteDoc
        .getText()
        .substring(0, offset)
        .replace(/<!--(.*?)-->/g, '');
    const lastIdxs = [
        idxOfLastOpeningTag(content, 'each'),
        idxOfLastOpeningTag(content, 'if'),
        idxOfLastOpeningTag(content, 'await'),
        idxOfLastOpeningTag(content, 'key')
    ];
    const lastIdx = lastIdxs.sort((i1, i2) => i2.lastIdx - i1.lastIdx);
    return lastIdx[0].lastIdx === -1 ? null : lastIdx[0].tag;
}

/**
 * Get the last tag and its index that is opened but not closed.
 */
function idxOfLastOpeningTag(content: string, tag: SvelteLogicTag) {
    const nrOfEndingTags = content.match(new RegExp(`{\\s*/${tag}`, 'g'))?.length ?? 0;

    let lastIdx = -1;
    let nrOfOpeningTags = 0;
    let match: RegExpExecArray | null;
    const regexp = new RegExp(`{\\s*#${tag}`, 'g');
    while ((match = regexp.exec(content)) != null) {
        nrOfOpeningTags += 1;
        lastIdx = match.index;
    }

    return { lastIdx: nrOfOpeningTags <= nrOfEndingTags ? -1 : lastIdx, tag };
}
