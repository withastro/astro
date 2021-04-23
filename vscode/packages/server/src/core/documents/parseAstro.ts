import { getFirstNonWhitespaceIndex } from './utils';

interface Frontmatter {
    state: null | 'open' | 'closed';
    startOffset: null | number;
    endOffset: null | number;
}

interface Content {
    firstNonWhitespaceOffset: null | number;
}

export interface AstroDocument {
    frontmatter: Frontmatter
    content: Content;
}

/** Parses a document to collect metadata about Astro features */
export function parseAstro(content: string): AstroDocument {
    const frontmatter = getFrontmatter(content)
    return {
        frontmatter,
        content: getContent(content, frontmatter)
    }
}

/** Get frontmatter metadata */
function getFrontmatter(content: string): Frontmatter {
    /** Quickly check how many `---` blocks are in the document */
    function getFrontmatterState(): Frontmatter['state'] {
        const parts = content.trim().split('---').length;
        switch (parts) {
            case 1: return null;
            case 2: return 'open';
            default: return 'closed';
        }
    }
    const state = getFrontmatterState();

    /** Construct a range containing the document's frontmatter */
    function getFrontmatterOffsets(): [number|null, number|null] {
        const startOffset = content.indexOf('---');
        if (startOffset === -1) return [null, null];
        const endOffset = content.slice(startOffset + 3).indexOf('---') + 3;
        if (endOffset === -1) return [startOffset, null];
        return [startOffset, endOffset];
    }
    const [startOffset, endOffset] = getFrontmatterOffsets();

    return {
        state,
        startOffset,
        endOffset
    };   
}

/** Get content metadata */
function getContent(content: string, frontmatter: Frontmatter): Content {
    switch (frontmatter.state) {
        case null: {
            const offset = getFirstNonWhitespaceIndex(content);
            return { firstNonWhitespaceOffset: offset === -1 ? null : offset }
        }
        case 'open': {
            return { firstNonWhitespaceOffset: null }
        }
        case 'closed': {
            const { endOffset } = frontmatter;
            const end = (endOffset ?? 0) + 3;
            const offset = getFirstNonWhitespaceIndex(content.slice(end))
            return { firstNonWhitespaceOffset: end + offset }
        }
    }
}
