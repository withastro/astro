import assert from 'assert';
import { HTMLDocument } from 'vscode-html-languageservice';
import { parseHtml } from '../../../src/lib/documents/parseHtml';

describe('parseHtml', () => {
    const testRootElements = (document: HTMLDocument) => {
        assert.deepStrictEqual(
            document.roots.map((r) => r.tag),
            ['Foo', 'style']
        );
    };

    it('ignore arrow inside moustache', () => {
        testRootElements(
            parseHtml(
                `<Foo on:click={() => console.log('ya!!!')} />
                <style></style>`
            )
        );
    });

    it('ignore greater than operator inside moustache', () => {
        testRootElements(
            parseHtml(
                `<Foo checked={a > 1} />
                <style></style>`
            )
        );
    });

    it('ignore less than operator inside moustache', () => {
        testRootElements(
            parseHtml(
                `<Foo checked={a < 1} />
                <style></style>`
            )
        );
    });

    it('ignore less than operator inside control flow moustache', () => {
        testRootElements(
            parseHtml(
                `<Foo>
                    {#if 1 < 2 && innWidth <= 700}
                        <Foo>
                            <SelfClosing />
                        </Foo>
                        <div>hi</div>
                    {/if}
                </Foo>
                <style></style>`
            )
        );
    });

    it('ignore less than operator inside moustache with tag not self closed', () => {
        testRootElements(
            parseHtml(
                `<Foo checked={a < 1}>
                </Foo>
                <style></style>`
            )
        );
    });

    it('parse baseline html', () => {
        testRootElements(
            parseHtml(
                `<Foo checked />
                <style></style>`
            )
        );
    });

    it('parse baseline html with moustache', () => {
        testRootElements(
            parseHtml(
                `<Foo checked={a} />
                <style></style>`
            )
        );
    });

    it('parse baseline html with control flow moustache', () => {
        testRootElements(
            parseHtml(
                `<Foo>
                    {#if true}
                        foo
                    {/if}
                </Foo>
                <style></style>`
            )
        );
    });

    it('parse baseline html with possibly un-closed start tag', () => {
        testRootElements(
            parseHtml(
                `<Foo checked={a}
                <style></style>`
            )
        );
    });
});
