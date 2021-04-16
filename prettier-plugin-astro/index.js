const { doc: { builders: { concat, hardline } } } = require("prettier");

/** @type {Partial<import('prettier').SupportLanguage>[]} */
module.exports.languages = [
    {
        name: 'astro',
        parsers: ['astro'],
        extensions: ['.astro'],
        vscodeLanguageIds: ['astro'],
    },
];

/** @type {Record<string, import('prettier').Parser>} */
module.exports.parsers = {
    astro: {
        parse: (text, parsers, options) => {
            const children = [];
            let frontmatter = text;
            let content = text;

            if (frontmatter.indexOf('---') > -1) {
                const delimiterStart = frontmatter.indexOf('---') + 3;
                frontmatter = frontmatter.slice(delimiterStart);
                const delimiterEnd = frontmatter.indexOf('---');
                content = frontmatter.slice(0).slice(delimiterEnd + 3);
                frontmatter = frontmatter.slice(0, delimiterEnd);

                children.push({
                    type: 'AstroFrontmatter',
                    children: [
                        { type: 'DelimiterStart', value: '---' },
                        {
                            type: 'AstroEmbed',
                            parser: 'babel-ts',
                            value: frontmatter
                        },
                        { type: 'DelimiterEnd', value: '---' }
                    ]
                })
            }

            children.push({
                type: 'AstroContent',
                children: [
                    {
                        type: 'AstroEmbed',
                        // TODO: handle JSX-like expressions
                        parser: 'html',
                        value: content
                    }
                ]
            });

            return {
                type: 'AstroRoot',
                children
            };
        },
        locEnd(node) {
            // TODO: actually track this
            return node.locEnd
        },
        locStart(node) {
            // TODO: actually track this
            return node.locStart
        },
        astFormat: 'astro-ast',
    },
};

/** @type {Record<string, import('prettier').Printer>} */
module.exports.printers = {
    'astro-ast': {
        print(path, opts, print) {
            const node = path.getValue();
            if (Array.isArray(node)) return concat(path.map(print));
            if (node.type === 'AstroEmbed') return concat([node]);
            if (Array.isArray(node.children)) return concat(path.map(print, 'children'));

            if (node.type === 'DelimiterStart') return concat([node.value, hardline]);
            if (node.type === 'DelimiterEnd') return concat([node.value, hardline, hardline]);
            return concat([node.value]);
        },
        embed(path, print, textToDoc, options) {
            const node = path.getValue();
            if (node.type !== 'AstroEmbed') return null;

            return textToDoc(node.value, { ...options, parser: node.parser });
        }
    },
};
