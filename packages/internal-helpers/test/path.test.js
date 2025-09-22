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
		
		// Backslash bypass attempts - these SHOULD be treated as remote paths
		// to prevent SSRF via URL normalization in downstream code
		assert.equal(isRemotePath('\\\\example.com/foo/bar.js'), true, 'double backslash should be detected as remote');
		assert.equal(isRemotePath('\\example.com/foo/bar.js'), true, 'single backslash should be detected as remote');
		assert.equal(isRemotePath('\\\\\\example.com/foo/bar.js'), true, 'triple backslash should be detected as remote');
		
		// Encoded backslash attempts - these should also be caught
		assert.equal(isRemotePath('%5C%5Cexample.com/foo/bar.js'), true, 'encoded double backslash should be detected as remote');
		assert.equal(isRemotePath('%5Cexample.com/foo/bar.js'), true, 'encoded single backslash should be detected as remote');
		
		// Mixed forward and backslashes
		assert.equal(isRemotePath('\\//example.com/foo/bar.js'), true, 'mixed backslash-forward should be detected as remote');
		assert.equal(isRemotePath('/\\example.com/foo/bar.js'), false, 'forward-backslash in path should not be remote');
		
		// Backslashes with protocols (malformed but could be normalized)
		assert.equal(isRemotePath('http:\\\\example.com/foo/bar.js'), true, 'http with backslashes should be detected as remote');
		assert.equal(isRemotePath('https:\\\\example.com/foo/bar.js'), true, 'https with backslashes should be detected as remote');
		assert.equal(isRemotePath('http:\\example.com/foo/bar.js'), true, 'http with single backslash should be detected as remote');
		
		// Other backslash edge cases
		assert.equal(isRemotePath('\\raw.githubusercontent.com/test.svg'), true, 'backslash with real domain should be detected as remote');
		assert.equal(isRemotePath('\\\\raw.githubusercontent.com/test.svg'), true, 'double backslash with real domain should be detected as remote');
	});
});
