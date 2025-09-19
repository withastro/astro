import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isRemotePath } from '../dist/path.js';

describe('isRemotePath', () => {
	it('should return true if the path is remote', () => {
		assert.equal(isRemotePath('https://example.com/foo/bar.js'), true, 'should be a remote path');
		assert.equal(isRemotePath('http://example.com/foo/bar.js'), true, 'should be a remote path');
		assert.equal(isRemotePath('//example.com/foo/bar.js'), true, 'should be a remote path');
		assert.equal(isRemotePath('ws://example.com/foo/bar.js'), true, 'should be a remote path');
		assert.equal(isRemotePath('ftp://example.com/foo/bar.js'), true, 'should be a remote path');
		assert.equal(isRemotePath('data:someCode'), true, 'should be a remote path');
		// false
		assert.equal(isRemotePath('/local/path/file.js'), false, 'should not be a remote path');
		assert.equal(isRemotePath('relative/path/file.js'), false, 'should not be a remote path');
		assert.equal(isRemotePath('./relative/path/file.js'), false, 'should not be a remote path');
		assert.equal(isRemotePath('../relative/path/file.js'), false, 'should not be a remote path');
		assert.equal(isRemotePath('C:\\windows\\path\\file.js'), false, 'should not be a remote path');
		assert.equal(
			isRemotePath('file://example.com/foo/bar.js'),
			false,
			'should not be a remote path',
		);
		assert.equal(
			isRemotePath('sftp://example.com/foo/bar.js'),
			false,
			'should not be a remote path',
		);
		assert.equal(
			isRemotePath('wss://example.com/foo/bar.js'),
			false,
			'should not be a remote path',
		);
		assert.equal(isRemotePath('mailto:example@example.com'), false, 'should not be a remote path');
	});
});
