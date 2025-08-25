// Test SSR behavior directly without running a server
import { handler } from './dist/server/entry.mjs';

async function testSSR() {
	console.log('Testing SSR with base path and trailingSlash: never\n');
	
	// Test root path
	console.log('Test 1: Root path /mybase');
	const rootRequest = new Request('http://example.com/mybase');
	const rootResponse = await handler(rootRequest);
	const rootHtml = await rootResponse.text();
	const rootMatch = rootHtml.match(/"pathname":\s*"([^"]+)"/);
	if (rootMatch) {
		console.log(`  Result: Astro.url.pathname = "${rootMatch[1]}"`);
		console.log(`  Status: ${rootMatch[1] === '/mybase' ? '✅ PASS' : '❌ FAIL - should be /mybase'}`);
	}
	
	console.log('\nTest 2: Subpage /mybase/subpage');
	const subRequest = new Request('http://example.com/mybase/subpage');
	const subResponse = await handler(subRequest);
	const subHtml = await subResponse.text();
	const subMatch = subHtml.match(/"pathname":\s*"([^"]+)"/);
	if (subMatch) {
		console.log(`  Result: Astro.url.pathname = "${subMatch[1]}"`);
		console.log(`  Status: ${subMatch[1] === '/mybase/subpage' ? '✅ PASS' : '❌ FAIL - should be /mybase/subpage'}`);
	}
	
	console.log('\nTest 3: Root path with trailing slash /mybase/');
	const rootSlashRequest = new Request('http://example.com/mybase/');
	const rootSlashResponse = await handler(rootSlashRequest);
	console.log(`  Response status: ${rootSlashResponse.status}`);
	console.log(`  Location header: ${rootSlashResponse.headers.get('location')}`);
	console.log(`  Status: ${rootSlashResponse.status === 301 && rootSlashResponse.headers.get('location') === '/mybase' ? '✅ PASS - redirects correctly' : '❌ FAIL - should redirect to /mybase'}`);
}

testSSR().catch(console.error);