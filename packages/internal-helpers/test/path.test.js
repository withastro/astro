import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isParentDirectory, isRemotePath } from '../dist/path.js';

describe('isRemotePath', () => {
	const remotePaths = [
		// Standard remote protocols
		'https://example.com/foo/bar.js',
		'http://example.com/foo/bar.js',
		'//example.com/foo/bar.js',
		'ws://example.com/foo/bar.js',
		'wss://example.com/foo/bar.js',
		'ftp://example.com/foo/bar.js',
		'sftp://example.com/foo/bar.js',
		'mailto:example@example.com',
		'data:someCode',
		'data:image/png;base64,iVBORw0KGgo',
		'data:text/html,<script>alert(1)</script>',

		// Backslash bypass attempts
		'\\\\example.com/foo/bar.js',
		'\\example.com/foo/bar.js',
		'\\\\\\example.com/foo/bar.js',
		'\\\\\\\\example.com/foo/bar.js',
		'\\raw.githubusercontent.com/test.svg',
		'\\\\raw.githubusercontent.com/test.svg',

		// URL-encoded backslash attempts
		'%5C%5Cexample.com/foo/bar.js',
		'%5Cexample.com/foo/bar.js',
		'%5c%5cexample.com/foo/bar.js',
		'%5cexample.com/foo/bar.js',
		'%5C%5C%5Cexample.com/foo/bar.js',
		'%5C%5C%5C%5Cexample.com/foo/bar.js',

		// Mixed encoding
		'%5C\\example.com/foo/bar.js',
		'\\%5Cexample.com/foo/bar.js',
		'%5c\\example.com/test',

		// Mixed forward and backslashes
		'\\//example.com/foo/bar.js',
		'\\//\\example.com/foo/bar.js',
		'/\\example.com/foo/bar.js', // Forward then backslash - suspicious
		'/\\\\example.com/foo/bar.js', // Forward then double backslash - suspicious

		// Protocol with backslashes
		'http:\\\\example.com/foo/bar.js',
		'https:\\\\example.com/foo/bar.js',
		'http:\\example.com/foo/bar.js',
		'https:\\example.com/foo/bar.js',
		'ftp:\\\\example.com/foo/bar.js',
		'ws:\\\\example.com/foo/bar.js',
		'wss:\\\\example.com/test', // WSS with backslashes
		'sftp:\\\\example.com/test', // SFTP with backslashes
		'HTTP:\\\\example.com/test',
		'HtTp:\\\\example.com/test',

		// Unicode escapes
		'\u005C\u005Cexample.com/test',
		'\u005Cexample.com/test',
		'\\u005C\\u005Cexample.com/test',

		// Null byte injection
		'\\example.com%00.jpg',
		'%5Cexample.com%00.jpg',
		'\\example.com\x00.jpg',

		// Whitespace injection
		'\\\texample.com/test',
		'\\ example.com/test',
		'\\%09example.com/test',
		'\\%20example.com/test',

		// Newline/carriage return injection
		'\\\nexample.com/test',
		'\\\rexample.com/test',
		'\\%0Aexample.com/test',
		'\\%0Dexample.com/test',

		// IP addresses
		'http://192.168.1.1/test',
		'//192.168.1.1/test',
		'\\\\192.168.1.1/test',
		'http://[::1]/test',
		'http://[2001:db8::1]/test',
		'//[::1]/test',
		'\\\\[::1]/test',

		// Localhost
		'http://localhost/test',
		'//localhost/test',
		'\\\\localhost/test',
		'http://127.0.0.1/test',
		'\\\\127.0.0.1/test',

		// With ports
		'http://example.com:8080/test',
		'//example.com:8080/test',
		'\\\\example.com:8080/test',
		'http:\\\\example.com:8080/test',

		// With auth - basic credential attacks
		'http://user:pass@example.com/test',
		'//user:pass@example.com/test',
		'\\\\user:pass@example.com/test',

		// Credential injection attempts to look like local paths
		'//admin:admin@/var/www/html', // Protocol-relative with path-like ending
		'\\\\admin:password@C:\\Windows\\System32', // UNC-style with Windows path
		'user:pass@/home/user/file.js', // No protocol but has creds and Unix path
		'admin:admin@C:\\Users\\Public', // No protocol but has creds and Windows path
		'//user@/local/path', // Single user@ with local-looking path
		'\\\\user@C:\\Program Files', // Backslash variant

		// Encoded credentials to bypass detection
		'http://%75ser:%70ass@example.com', // URL-encoded "user:pass"
		'http://user%3Apass@example.com', // Encoded colon in creds
		'http://user:pass%40example.com', // Encoded @ in password
		'//%75%73%65%72:%70%61%73%73@example.com', // Fully encoded creds
		'\\\\%75ser:%70ass@example.com', // Backslash with encoded creds

		// Double/triple encoding credentials
		'http://%2575ser:%2570ass@example.com', // Double encoded
		'http://%252575ser:%252570ass@example.com', // Triple encoded

		// Credentials with special characters trying to break parsing
		'http://user:p@ss@example.com', // @ in password
		'http://user:pass:extra@example.com', // Multiple colons
		'http://user::@example.com', // Empty password with double colon
		'http://:password@example.com', // Empty username
		'http://@example.com', // Just @ symbol
		'//user:@example.com', // Empty password
		'//:pass@example.com', // Empty username protocol-relative

		// Credentials with path traversal
		'http://user:../../../etc/passwd@example.com', // Path traversal in password
		'http://../../admin:pass@example.com', // Path traversal in username
		'//user:pass@example.com/../../etc/passwd', // Creds with traversal after

		// Credentials with null bytes and special chars
		'http://user%00:pass@example.com', // Null byte in username
		'http://user:pass%00@example.com', // Null byte in password
		'http://user\x00:pass@example.com', // Hex null byte
		'http://user:pass\0@example.com', // Escaped null

		// OAuth/API key patterns that might be confused
		'http://oauth2:CLIENT_SECRET_HERE@example.com',
		'http://api_key:SECRET_KEY_123@example.com',
		'//token:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9@example.com', // JWT-like

		// Credentials with port confusion
		'http://user:pass@example.com:8080', // Standard with port
		'http://user:8080@example.com', // Port-like password
		'http://admin:3306@localhost', // MySQL port as password
		'//root:22@server.com', // SSH port as password

		// Unicode in credentials
		'http://üser:pāss@example.com', // Unicode username/password
		'http://用户:密码@example.com', // Chinese characters
		'http://админ:пароль@example.com', // Cyrillic
		'http://\u0075ser:\u0070ass@example.com', // Unicode escapes

		// Homograph attacks in credentials
		'http://аdmin:pаssword@example.com', // Cyrillic 'а' looks like Latin 'a'
		'http://adⅿin:password@example.com', // Unicode small m lookalike

		// Large credentials trying to overflow
		'http://' + 'a'.repeat(1000) + ':' + 'b'.repeat(1000) + '@example.com',
		'//' + 'x'.repeat(10000) + '@example.com', // Massive username

		// Mixed slashes with credentials
		'http:\\//user:pass@example.com', // Mixed slashes in protocol
		'http://user:pass@example.com\\path', // Mixed slashes in path
		'\\//user:pass@example.com', // Backslash then protocol-relative

		// Credentials to bypass startsWith checks
		// These try to trick checks like if(path.startsWith('/home')) or if(path.startsWith('src/'))
		'//user:pass@/home/user/file.js', // Looks like /home but has protocol-relative with creds
		'//token@/usr/local/bin', // Looks like /usr but is protocol-relative
		'//api:key@/etc/passwd', // Looks like /etc but has creds
		'//admin@/var/www/html/index.html', // Looks like /var but has creds
		'//root@src/index.js', // Looks like src/ but protocol-relative with creds
		'//user@public/assets/logo.png', // Looks like public/ but has creds
		'//deploy@dist/bundle.js', // Looks like dist/ but has creds
		'//ci:token@node_modules/package', // Looks like node_modules/ but has creds

		// Using credentials patterns that parse as valid URLs
		'user:pass@localhost/admin', // Credentials with localhost
		'admin:admin@127.0.0.1:8080', // Credentials with IP and port
		'root:toor@evil.com/payload', // Clear credential pattern

		// Credentials with localhost/127.0.0.1 to look local
		'//admin:admin@localhost/admin', // Localhost but still remote protocol
		'//root:toor@127.0.0.1/phpmyadmin', // Loopback but still remote
		'//user@localhost:3000/api', // Localhost with port
		'//dev:dev@[::1]/graphql', // IPv6 localhost
		'//test@0.0.0.0/test', // 0.0.0.0 binding address

		// File URLs with @ trying to look like local paths
		'file://user@/etc/hosts', // file:// but with user@
		'file://admin:pass@localhost/C:/Windows/System32', // file:// localhost Windows
		'file://root@127.0.0.1/home/user', // file:// with IP

		// Encoded credentials in paths that might decode to look local
		'//%2F%2Fhome/user', // Encoded // at start: //home/user
		'//%2Fetc%2Fpasswd@evil.com', // Encoded /etc/passwd@evil.com
		'%2F%2Fadmin:admin@/var/log', // Encoded //admin:admin@/var/log
		'//%252Fhome%252Fuser@evil.com', // Double encoded /home/user

		// Vite-like paths with credentials (trying to bypass Vite path detection)
		'//user@/@fs/home/user/project', // Vite /@fs/ with creds before
		'//admin@/@id/virtual:module', // Vite /@id/ with creds
		'//dev@/@vite/client', // Vite client with creds
		'//@react-refresh', // Vite React refresh with just @

		// Query strings and fragments
		'http://example.com/test?param=value',
		'\\\\example.com/test?param=value',
		'http://example.com/test#fragment',
		'\\\\example.com/test#fragment',

		// Edge cases with dots
		'http://example..com/test',
		'\\\\example..com/test',
		'http://.example.com/test',
		'\\\\.example.com/test',

		// Long domains
		'\\\\' + 'a'.repeat(1000) + '.com/test',
		'http://' + 'a'.repeat(1000) + '.com/test',

		// Minimal cases
		'\\', // Single backslash
		'\\\\', // Double backslash
		'//', // Protocol-relative
		'http://',
		'https://',
		'data:',

		// Path traversal
		'http://example.com/./../../test',
		'\\\\example.com/./../../test',
		'http://example.com/%2e%2e/test',
		'\\\\example.com/%2e%2e/test',

		// Windows special paths
		'\\\\?\\C:\\test',
		'\\\\.\\pipe\\test',
		'\\\\LOCALHOST\\share',
		'\\\\127.0.0.1\\share',

		// Punycode and Unicode domains
		'http://xn--e1afmkfd.xn--p1ai/test',
		'\\\\xn--e1afmkfd.xn--p1ai/test',
		'http://例え.jp/test',
		'\\\\例え.jp/test',

		// Case variations
		'HtTp://example.com/test',
		'HTTP://example.com/test',
		'DATA:text/plain,hello', // Uppercase data URL
		'Data:text/plain,test', // Mixed case data URL
		'dAtA:text/plain,test', // Weird case data URL

		// Mixed slashes in protocols
		'http:\\//example.com/test',
		'https:/\\example.com/test',
		'ftp://\\example.com/test',
		'ws:\\//example.com/test',

		// Brackets
		'http://[example.com]/test',
		'\\\\[example.com]/test',
		'http://(example.com)/test',
		'\\\\(example.com)/test',

		// Malformed but has protocol prefix (conservative: treated as remote)
		'http:%2F%2Fexample.com/test', // Encoded slashes after colon

		// JavaScript and other dangerous protocols
		'javascript:alert(1)',
		'JavaScript:alert(1)', // Case variant
		'vbscript:msgbox',
		'data:application/javascript,alert(1)',
		'jar:http://example.com/evil.jar!/',
		'view-source:http://example.com',
		'about:blank',
		'blob:http://example.com/uuid',
		'filesystem:http://example.com/temp/',

		// Browser/app specific protocols
		'chrome://settings',
		'chrome-extension://abc/page.html',
		'moz-extension://abc/page.html',
		'safari-extension://abc/page.html',
		'opera://settings',
		'edge://settings',
		'resource://gre/modules/',

		// Other network protocols
		'git://github.com/user/repo.git',
		'ssh://user@host.com',
		'telnet://host.com',
		'gopher://example.com',
		'redis://localhost:6379',
		'mongodb://localhost:27017',
		'postgresql://localhost:5432',
		'mysql://localhost:3306',
		'ldap://example.com',
		'nntp://news.example.com',

		// Mobile/communication protocols
		'tel:+1234567890',
		'sms:+1234567890',
		'mailto:test@test.com', // Already in list but keeping for completeness

		// Authority confusion with @
		'http://google.com@evil.com',
		'http://user:pass@good.com@evil.com',
		'//google.com@evil.com',
		'\\\\google.com@evil.com',

		// Windows UNC paths that could be URL bypass attempts
		'\\\\example.com\\share\\file.js', // Could be //example.com
		'\\\\evil.com\\payload', // Could be //evil.com
		'\\\\localhost\\share\\file.js', // Even localhost could be suspicious
		'\\\\127.0.0.1\\c$\\windows', // IP-based UNC
		'\\\\LOCALHOST\\pipe\\test', // Uppercase variant
		'\\Program Files\\app', // Single backslash - ambiguous
		'\\Users\\Public\\Documents', // Single backslash - ambiguous
		'\\\\?\\C:\\very\\long\\path', // Windows long path (treating as remote for safety)
		'\\\\.\\COM1', // Device path (treating as remote for safety)
		'\\\\.\\pipe\\pipename', // Named pipe (treating as remote for safety)

		// Encoded @ attempts
		'http://example.com%40evil.com/path',
		'http://example.com%2540evil.com/path', // Double encoded @

		// IP address encoding tricks
		'http://2130706433/', // 127.0.0.1 as decimal
		'http://0x7f.0x0.0x0.0x1/', // 127.0.0.1 as hex
		'http://0177.0.0.1/', // 127.0.0.1 partial octal
		'http://127.1/', // Short form IP
		'http://127.0.1/', // Another short form
		'http://[::ffff:127.0.0.1]/', // IPv4-mapped IPv6

		'http://\0example.com', // Null before domain

		// Multiple slashes and dots
		'http:///example.com', // Triple slash
		'http:////example.com', // Quad slash
		'http://example.com..', // Double dots at end
		'http://example.com./', // Dot slash at end
		'http://example.com./.', // Multiple dots
		'http://.example.com', // Leading dot (handled earlier but different context)

		// Relative URLs that look suspicious
		'http:example.com', // Missing slashes (relative URL in HTTP context)
		'https:example.com', // Missing slashes
		'//http://example.com', // Protocol-relative with protocol
		'////example.com', // Multiple slashes

		// Case sensitivity edge cases for data URLs
		'DATA:,test',
		'dAtA:,test',
		'DaTa:,test',

		'http:/\\example.com', // Mixed slash backslash (this is actually http:/\example.com)
	];

	const localPaths = [
		// Standard Unix/Linux absolute paths
		'/local/path/file.js',
		'/usr/local/bin/node',
		'/home/user/projects/app.js',
		'/var/www/html/index.html',
		'/opt/application/config.json',
		'/tmp/build-output.js',
		'/dev/null',
		'/proc/self/exe',
		'/etc/hosts',

		// macOS specific paths
		'/System/Library/Frameworks',
		'/Applications/App.app/Contents',
		'/Users/username/Documents',
		'/Volumes/External Drive/file.js',
		'/private/tmp/file.js',
		'/Library/Application Support/app',

		// Standard relative paths
		'relative/path/file.js',
		'./relative/path/file.js',
		'../relative/path/file.js',
		'../../parent/parent/file.js',
		'./file.js',
		'../file.js',
		'file.js',
		'index.html',
		'src/components/Button.tsx',
		'node_modules/package/dist/index.js',
		'dist/assets/index-abc123.js',

		// Single dot paths
		'.',
		'./',
		'./.',

		// Double dot paths
		'..',
		'../',
		'../.',

		// Windows absolute paths (various formats)
		'C:\\windows\\path\\file.js',
		'C:/windows/path/file.js', // Forward slashes on Windows
		'D:\\Program Files\\app\\main.exe',
		'E:/Projects/web/index.html',
		'Z:\\network\\share\\file.doc',

		// Windows drive-relative paths (uncommon but valid)
		'C:file.txt', // Relative to current directory on C:
		'D:folder\\file.js',

		// file:// protocol is local (all variations)
		'file://example.com/foo/bar.js',
		'file:', // Just file protocol
		'file://', // File with slashes
		'file:///', // File with triple slash (absolute path)
		'file:////', // File with quad slash
		'file://///server/share', // UNC path via file protocol
		'File://example.com', // Uppercase file
		'FILE://example.com', // All caps file
		'fILe://example.com', // Mixed case file

		// file:// with backslashes is still local
		'file:\\\\example.com/test',

		// file:// URLs with legitimate @ symbols (NOT credentials)
		'file:///home/user/package@1.0.0.tgz', // NPM package file
		'file:///Users/dev/icon@2x.png', // Retina image file
		'file:///C:/Projects/@company/app/index.js', // Scoped package path
		'file:///var/cache/@cache_key.dat', // Cache file with @
		'file://localhost/home/backup@2024.sql', // Backup file
		'file:///opt/app/sprite@mobile.css', // Responsive asset
		'file:///D:/Work/email@example.com.txt', // Email as filename
		'file:///home/user/@types/node/index.d.ts', // TypeScript defs
		'file:///app/test@integration.spec.js', // Test file
		'file:///Users/john/logo@dark@2x.png', // Multiple @ in name

		// Vite-specific paths (all should be local)
		'/@fs/local/path/file.js',
		'/@fs/C:/Users/project/src/main.js',
		'/@fs/Users/mac/project/src/app.vue',
		'/@id/local/path/file.js',
		'/@id/__x00__virtual:file',
		'/@vite/client',
		'/@vite/env',
		'/@react-refresh',
		'/node_modules/.vite/deps/vue.js',
		'/node_modules/.vite/deps/_metadata.json',
		'/__vite_ping',
		'/src/main.ts?t=1234567890',
		'/src/assets/logo.png?import',
		'/src/styles.css?direct',
		'/@modules/my-package',
		'/~partytown/debug/partytown.js',

		// Fragment and query strings without protocols (local)
		'#http://evil.com',
		'#//evil.com',
		'?http://evil.com',
		'?//evil.com',

		// Paths with spaces (valid local paths)
		'/path with spaces/file.js',
		'C:\\Program Files (x86)\\app\\file.exe',
		'./folder with spaces/index.html',
		'/Users/John Doe/Documents/file.txt',
		'My Documents\\Projects\\app.js',

		// Paths with special characters
		'/path/to/file-name_2023.test.js',
		'/path/to/file@2x.png',
		'/path/to/file#1.js',
		// Legitimate @ in filenames (NOT credentials)
		'package@1.0.0.tgz', // NPM package versioning
		'user@2x.png', // Retina image naming
		'icon@3x.png', // iOS asset naming
		'logo@2x@dark.png', // Multiple @ in filename
		'@babel/core/lib/index.js', // Scoped package path
		'/@babel/preset-env', // Scoped package in node_modules
		'node_modules/@types/node/index.d.ts', // TypeScript definitions
		'./@company/shared-ui/Button.tsx', // Monorepo package
		'packages/@my-org/utils/index.js', // Lerna/workspace package
		'email@example.com.txt', // Email as filename
		'backup@2023-12-01.sql', // Backup file naming
		'snapshot@latest.json', // Version/tag in filename
		'test@integration.spec.js', // Test file naming
		'sprite@mobile.css', // Responsive asset naming
		'/var/cache/nginx/@cache_key', // Cache files with @
		'/path/to/[bracketed]/file.js',
		'/path/to/(parentheses)/file.js',
		'/path/to/file$.js',
		'/path/to/file+plus.js',
		'/path/to/file=equals.js',
		'/path/to/file&ampersand.js',
		'/path/to/file,comma.js',
		'/path/to/file;semicolon.js',
		"/path/to/file'quote.js",
		'/path/to/file`backtick.js',
		'C:\\Users\\user!\\file%.txt',

		// Paths with Unicode characters
		'/用户/文档/文件.js',
		'/путь/к/файлу.js',
		'/مسار/إلى/ملف.js',
		'/パス/ファイル.js',
		'/경로/파일.js',
		'C:\\文档\\项目\\app.js',

		// Query parameters on local paths (common in dev servers)
		'/src/main.js?v=12345',
		'/assets/style.css?inline',
		'/image.png?w=500&h=300',
		'./component.vue?type=template',
		'../styles/theme.scss?module',

		// Hash fragments on local paths
		'/docs/guide.html#introduction',
		'/app.js#section',
		'./page.html#top',
		'index.html#/route/path',

		// Edge case: paths that look like URLs but aren't
		'http', // Just the word http as a filename
		'https', // Just the word https as a filename
		'ftp', // Just the word ftp as a filename
		'ws', // Just the word ws as a filename
		'C:http', // Windows drive with filename http
		'./http', // Relative path to file named http
		'../https', // Parent directory file named https

		// Paths starting with URL-like strings but no protocol separator
		'httpserver/file.js',
		'https_server/file.js',
		'ftpd/config.json',
		'wss_module/index.js',
		'data-processor/file.js',
		'javascript-files/app.js',

		// Build tool specific paths
		'/.next/static/chunks/main.js',
		'/_next/data/buildid/page.json',
		'/.nuxt/dist/client/app.js',
		'/public/build/bundle.js',
		'/static/js/main.chunk.js',
		'/dist/assets/index.js',
		'/_app/immutable/chunks/index.js', // SvelteKit
		'/.svelte-kit/generated/client/app.js',

		// Package manager paths
		'node_modules/react/index.js',
		'.pnpm/react@18.0.0/node_modules/react/index.js',
		'.yarn/cache/package.zip',
		'bower_components/jquery/dist/jquery.js',

		// Paths with multiple dots
		'../../../file.js',
		'./././file.js',
		'.../weird/path.js', // Triple dots (valid but unusual)
		'file...js', // Multiple dots in filename
		'file.test.spec.js', // Multiple extensions

		// Invalid/malformed encodings (should handle gracefully)
		'%%36%38ttp://example.com', // Invalid double %
		'%GGexample.com', // Invalid hex characters
		'%1', // Incomplete encoding
		'%', // Just a percent sign
		'%%%', // Multiple percent signs

		// Empty string
		'',
	];

	it('should correctly identify remote paths', () => {
		remotePaths.forEach((path) => {
			assert.equal(isRemotePath(path), true, `Expected "${path}" to be remote`);
		});
	});

	it('should correctly identify local paths', () => {
		localPaths.forEach((path) => {
			assert.equal(isRemotePath(path), false, `Expected "${path}" to be local`);
		});
	});
});

describe('isParentDirectory', () => {
	it('should correctly identify parent-child relationships', () => {
		const validCases = [
			// Unix absolute paths
			['/home', '/home/user'],
			['/home', '/home/user/documents'],
			['/home/user', '/home/user/documents/file.txt'],
			['/var', '/var/www/html/index.html'],
			['/usr/local', '/usr/local/bin/node'],
			['/', '/home'],
			['/', '/usr/local/bin'],

			// Unix relative paths
			['src', 'src/components'],
			['src', 'src/components/Button.tsx'],
			['.', './file.js'],
			['.', './src/index.js'],

			// Windows absolute paths
			['C:\\Users', 'C:\\Users\\Admin'],
			['C:\\Users', 'C:\\Users\\Admin\\Documents'],
			['C:\\', 'C:\\Windows\\System32'],
			['D:\\Projects', 'D:\\Projects\\app\\src\\main.js'],
			['C:/', 'C:/Windows/System32'], // Forward slashes on Windows

			// Windows relative paths
			['src', 'src\\components'],
			['.', '.\\file.js'],

			// Mixed slashes (normalized internally)
			['C:/Users', 'C:\\Users\\Admin\\Documents'],
			['/home/user', '/home/user\\documents'],

			// Paths with single dots that resolve correctly
			['/home', '/home/./user'],
			['src', 'src/./components'],

			// Case insensitive for Windows
			['c:\\users', 'C:\\Users\\Admin'],
			['C:\\USERS', 'c:\\users\\admin'],

			// Very long paths (valid parent-child)
			['/' + 'a'.repeat(1000), '/' + 'a'.repeat(1000) + '/b'],
		];

		validCases.forEach(([parent, child]) => {
			assert.equal(
				isParentDirectory(parent, child),
				true,
				`Expected "${parent}" to be parent of "${child}"`,
			);
		});
	});

	it('should correctly reject non-parent relationships', () => {
		const invalidCases = [
			// Different directories
			['/home', '/usr'],
			['/home/user', '/home/otheruser'],
			['src/components', 'src/utils'],
			['C:\\Users', 'C:\\Windows'],

			// Child is not descendant
			['/home/user/documents', '/home/user'], // Parent longer than child
			['src/components/Button', 'src/components'], // Parent longer
			['/home/user', '/home'], // Reversed relationship

			// Different drives on Windows
			['C:\\Users', 'D:\\Users'],
			['C:\\', 'D:\\'],

			// Absolute vs relative
			['/home', 'home'],
			['C:\\Users', 'Users'],
			['home', '/home'],

			// Path traversal attempts
			['/home', '/etc/../home/user'], // Resolves to /home/user but starts elsewhere
			['/restricted', '/restricted/../../../etc/passwd'], // Traversal outside

			// Empty or null paths
			['', '/home'],
			['/home', ''],
			['', ''],
			[null, '/home'],
			['/home', null],
			[undefined, '/home'],

			// Same path (not parent-child)
			['/home/user', '/home/user'],
			['src', 'src'],
			['C:\\Users', 'C:\\Users'],

			// Partial name match but not parent
			['/home', '/homepage'],
			['/home', '/home2'],
			['src', 'src2'],
			['test', 'test-utils'],

			// Special characters and null bytes
			['/home\0', '/home/user'],
			['/home', '/home\0/user'],
			['/home', '/home/\0user'],
		];

		invalidCases.forEach(([parent, child]) => {
			assert.equal(
				isParentDirectory(parent, child),
				false,
				`Expected "${parent}" NOT to be parent of "${child}"`,
			);
		});
	});

	it('should handle adversarial inputs safely', () => {
		const adversarialCases = [
			// Path traversal attacks
			['/safe', '/safe/../../../etc/passwd'],
			['/app', '/app/../../../../root/.ssh'],
			['C:\\Safe', 'C:\\Safe\\..\\..\\..\\Windows\\System32'],

			// URL-like paths
			['http://evil.com', 'http://evil.com/payload'],
			['//evil.com', '//evil.com/hack'],
			['file://host', 'file://host/etc/passwd'],

			// Encoded paths
			['/home', '/%2e%2e/home/user'], // Encoded ..
			['/home', '/home%2Fuser'], // Encoded /

			// Very long paths that don't match
			['/short', '/' + 'a'.repeat(10000)],

			// Symlink-like patterns
			['/real', '/real/../../symlink/target'],
			['/app', '/app/node_modules/.bin/../../../outside'],

			// Credentials in paths
			['/home/safe', 'file:///home/safe/user:@/etc/passwd'],
			['C:\\Safe', 'file:///C:\\Safe\\user:@\\Windows\\System32'],
		];

		adversarialCases.forEach(([parent, child]) => {
			// Should safely return false for all adversarial inputs
			assert.equal(
				isParentDirectory(parent, child),
				false,
				`Expected adversarial input "${parent}" vs "${child}" to return false safely`,
			);
		});
	});

	it('should handle edge cases correctly', () => {
		// Root paths
		assert.equal(isParentDirectory('/', '/home'), true);
		assert.equal(isParentDirectory('/', '/'), false); // Same path
		assert.equal(isParentDirectory('C:\\', 'C:\\Windows'), true);
		assert.equal(isParentDirectory('C:\\', 'C:\\'), false);

		// Current directory
		assert.equal(isParentDirectory('.', './src'), true);
		assert.equal(isParentDirectory('.', '.'), false);

		// Parent directory references not allowed (.. paths rejected)
		assert.equal(isParentDirectory('..', '../src'), false);
		assert.equal(isParentDirectory('../..', '../../src/main.js'), false);

		// Trailing slashes
		assert.equal(isParentDirectory('/home/', '/home/user'), true);
		assert.equal(isParentDirectory('/home', '/home/user/'), true);
		assert.equal(isParentDirectory('/home/', '/home/user/'), true);

		// Multiple slashes
		assert.equal(isParentDirectory('/home', '/home//user'), true);
		assert.equal(isParentDirectory('/home', '/home///user///docs'), true);
	});
});
