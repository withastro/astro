import * as assert from 'assert';
import { Document } from '../../../src/lib/documents';
import { Position } from 'vscode-languageserver';

describe('Document', () => {
    it('gets the correct text', () => {
        const document = new Document('file:///hello.svelte', '<h1>Hello, world!</h1>');
        assert.strictEqual(document.getText(), '<h1>Hello, world!</h1>');
    });

    it('sets the text', () => {
        const document = new Document('file:///hello.svelte', '<h1>Hello, world!</h1>');
        document.setText('<h1>Hello, svelte!</h1>');
        assert.strictEqual(document.getText(), '<h1>Hello, svelte!</h1>');
    });

    it('increments the version on edits', () => {
        const document = new Document('file:///hello.svelte', 'hello');
        assert.strictEqual(document.version, 0);

        document.setText('Hello, world!');
        assert.strictEqual(document.version, 1);
        document.update('svelte', 7, 12);
        assert.strictEqual(document.version, 2);
    });

    it('recalculates the tag infos on edits', () => {
        const document = new Document('file:///hello.svelte', '<script>a</script><style>b</style>');
        assert.deepEqual(document.scriptInfo, {
            content: 'a',
            attributes: {
                lang: 'javascript'
            },
            start: 8,
            end: 9,
            startPos: Position.create(0, 8),
            endPos: Position.create(0, 9),
            container: { start: 0, end: 18 }
        });
        assert.deepEqual(document.styleInfo, {
            content: 'b',
            attributes: {
                lang: 'css'
            },
            start: 25,
            end: 26,
            startPos: Position.create(0, 25),
            endPos: Position.create(0, 26),
            container: { start: 18, end: 34 }
        });

        document.setText('<script>b</script>');
        assert.deepEqual(document.scriptInfo, {
            content: 'b',
            attributes: {
                lang: 'javascript'
            },
            start: 8,
            end: 9,
            startPos: Position.create(0, 8),
            endPos: Position.create(0, 9),
            container: { start: 0, end: 18 }
        });
        assert.strictEqual(document.styleInfo, null);
    });

    it('returns the correct file path', () => {
        const document = new Document('file:///hello.svelte', 'hello');

        assert.strictEqual(document.getFilePath(), '/hello.svelte');
    });

    it('returns null for non file urls', () => {
        const document = new Document('ftp:///hello.svelte', 'hello');

        assert.strictEqual(document.getFilePath(), null);
    });

    it('gets the text length', () => {
        const document = new Document('file:///hello.svelte', 'Hello, world!');
        assert.strictEqual(document.getTextLength(), 13);
    });

    it('updates the text range', () => {
        const document = new Document('file:///hello.svelte', 'Hello, world!');
        document.update('svelte', 7, 12);
        assert.strictEqual(document.getText(), 'Hello, svelte!');
    });

    it('gets the correct position from offset', () => {
        const document = new Document('file:///hello.svelte', 'Hello\nworld\n');
        assert.deepStrictEqual(document.positionAt(1), { line: 0, character: 1 });
        assert.deepStrictEqual(document.positionAt(9), { line: 1, character: 3 });
        assert.deepStrictEqual(document.positionAt(12), { line: 2, character: 0 });
    });

    it('gets the correct offset from position', () => {
        const document = new Document('file:///hello.svelte', 'Hello\nworld\n');
        assert.strictEqual(document.offsetAt({ line: 0, character: 1 }), 1);
        assert.strictEqual(document.offsetAt({ line: 1, character: 3 }), 9);
        assert.strictEqual(document.offsetAt({ line: 2, character: 0 }), 12);
    });

    it('gets the correct position from offset with CRLF', () => {
        const document = new Document('file:///hello.svelte', 'Hello\r\nworld\r\n');
        assert.deepStrictEqual(document.positionAt(1), { line: 0, character: 1 });
        assert.deepStrictEqual(document.positionAt(10), { line: 1, character: 3 });
        assert.deepStrictEqual(document.positionAt(14), { line: 2, character: 0 });
    });

    it('gets the correct offset from position with CRLF', () => {
        const document = new Document('file:///hello.svelte', 'Hello\r\nworld\r\n');
        assert.strictEqual(document.offsetAt({ line: 0, character: 1 }), 1);
        assert.strictEqual(document.offsetAt({ line: 1, character: 3 }), 10);
        assert.strictEqual(document.offsetAt({ line: 2, character: 0 }), 14);
    });

    it('limits the position when offset is out of bounds', () => {
        const document = new Document('file:///hello.svelte', 'Hello\nworld\n');
        assert.deepStrictEqual(document.positionAt(20), { line: 2, character: 0 });
        assert.deepStrictEqual(document.positionAt(-1), { line: 0, character: 0 });
    });

    it('limits the offset when position is out of bounds', () => {
        const document = new Document('file:///hello.svelte', 'Hello\nworld\n');
        assert.strictEqual(document.offsetAt({ line: 5, character: 0 }), 12);
        assert.strictEqual(document.offsetAt({ line: 1, character: 20 }), 12);
        assert.strictEqual(document.offsetAt({ line: -1, character: 0 }), 0);
    });

    it('supports empty contents', () => {
        const document = new Document('file:///hello.svelte', '');
        assert.strictEqual(document.offsetAt({ line: 0, character: 0 }), 0);
        assert.deepStrictEqual(document.positionAt(0), { line: 0, character: 0 });
    });
});
