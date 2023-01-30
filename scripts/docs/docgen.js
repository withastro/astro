import { slug as githubSlug } from 'github-slugger';
import fs from 'fs';
import path from 'path';
import jsdoc from 'jsdoc-api';

// Fill this in to test a response locally, with fetching.
const STUB =  fs.readFileSync('packages/astro/src/@types/astro.ts', {encoding: 'utf-8'});
const VALID_CATEGORY = ['config', 'cliCommand', 'type'];
function processComment(comment) {
    if (comment.kind === 'heading') {
        return;
    }
    const cliFlag = comment.tags.find((f) => f.title === 'cli');
    const categoryFlag = comment.tags.find((f) => f.title === 'category');
    const typerawFlag = comment.tags.find((f) => f.title === 'typeraw');
    console.log(categoryFlag);
    if (!comment.name) {
        throw new Error(`Missing @docs JSDoc tag: @name`);
    }
    if (!comment.type && !typerawFlag) {
        throw new Error(`Missing @docs JSDoc tag: @type or @typeraw`);
    }
    if (!categoryFlag) {

    }
    // if (!VALID_CATEGORY.includes(categoryFlag.text)) { {
        
    // }
    const typesFormatted = typerawFlag
        ? typerawFlag.text.replace(/\{(.*)\}/, '$1')
        : comment.type.names.join(' | ');

    return {
        slug: githubSlug(comment.longname),
        name: comment.longname,
        description: comment.description && comment.description.trim(),
        category: categoryFlag && categoryFlag.text,
        type: typesFormatted,
        cliFlag: cliFlag && cliFlag.text,
        defaultValue: comment.defaultvalue,
        version: comment.version,
        seeAlsoLinks: comment.see,
    }
}
/**
 * The simple demo does not rely on the TypeScript compiler API; instead, it parses the
 * source file directly.  It uses the default parser configuration.
 */
export async function run() {
    const inputBuffer =
        STUB ||
        (await fetch(
            'https://raw.githubusercontent.com/withastro/astro/main/packages/astro/src/%40types/astro.ts'
        ).then((r) => r.text()));

    // Get all `@docs` JSDoc comments in the file.
    const allComments = [
        ...inputBuffer.matchAll(/\/\*\*\s*\n([^\*]|\*[^\/])*@docs([^\*]|\*[^\/])*\*\//g),
    ];
    const allCommentsInput = allComments
        .map((m) => m[0])
        .filter((c) => c.includes('* @docs'))
        .join('\n\n');

    console.log(jsdoc);
    console.log(allCommentsInput);
    console.log(jsdoc.explainSync({ source: allCommentsInput }));

    const allParsedComments = jsdoc
        .explainSync({ source: allCommentsInput })
        .filter((data) => data.tags);

    let result = ``;

    for (const comment of allParsedComments) {
        const proccessedCommentDoc = processComment(comment);
        if (!proccessedCommentDoc) {
            continue;
        }
        console.log(`packages/astro/reference/${proccessedCommentDoc.slug}.json`);
        const savePath = `packages/astro/reference/${proccessedCommentDoc.slug}.json`;
        fs.mkdirSync(path.dirname(savePath), { recursive: true });
        fs.writeFileSync(
            savePath,
            JSON.stringify(proccessedCommentDoc, undefined, 2),
            'utf8'
        );
    }

    // result = result.replace(/https:\/\/docs\.astro\.build\//g, '/');

    // console.log(result);
    // fs.writeFileSync(
    //     'src/pages/en/reference/configuration-reference.mdx',
    //     HEADER + result + FOOTER,
    //     'utf8'
    // );
}

run();
