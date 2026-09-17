#!/usr/bin/env node

async function main() {
	if (process.argv.includes('--version')) {
		const json = await import('../package.json', { with: { type: 'json' } });
		console.log(json.default.version)
	} else { 
		await import('../dist/nodeServer.js')
	}
}

void main()
