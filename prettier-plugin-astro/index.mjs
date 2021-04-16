/** @type {Partial<import('prettier').SupportLanguage>[]} */
export const languages = [
    {
        name: 'astro',
        parsers: ['astro'],
        extensions: ['.astro'],
        vscodeLanguageIds: ['astro'],
    },
];

/** @type {Record<string, import('prettier').Parser>} */
export const parsers = {
    astro: {
        parse: (text) => {

        },
        locEnd(node) {
            return node.locEnd
        },
        locStart(node) {
            return node.locStart
        },
        astFormat: 'astro-ast',
    },
};

/** @type {Record<string, import('prettier').Printer>} */
export const printers = {
    'astro-ast': {
        print() {
            /** @type {any} */
            const doc = {};
            return doc;
        }
    },
};

