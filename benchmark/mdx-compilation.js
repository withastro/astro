import { performance } from 'node:perf_hooks';
import { createMarkdownProcessorRouter } from '../packages/astro/src/core/markdown/processor-router.js';

console.log('🚀 MDX Compilation Benchmark');
console.log('============================\n');

// Sample MDX content for testing
const sampleContent = `---
title: "Benchmark Test"
date: "2024-01-01"
tags: ["performance", "test"]
---

# Performance Benchmark Test

This is a sample document to test **MDX compilation performance**.

## Features

- *Italic text*
- **Bold text**
- ~~Strikethrough text~~

### Code Example

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
\`\`\`

### List Items

1. First item
2. Second item
3. Third item

- Unordered item
- Another item
- Final item

### Table

| Compiler | Speed | Memory |
|----------|-------|--------|
| JavaScript | 1x | High |
| Rust | 10x | Low |

### Images

![Sample Image](./sample.png)
![Remote Image](https://example.com/image.jpg)

> This is a blockquote to test quote processing.

## Conclusion

The Rust compiler should provide significant performance improvements.
`;

const baseConfig = {
	image: { service: { entrypoint: 'astro/assets/services/sharp' } },
	experimentalHeadingIdCompat: false,
	gfm: true,
	smartypants: true,
	remarkPlugins: [],
	rehypePlugins: [],
	rsOptions: {
		fallbackToJs: true,
		cacheDir: './node_modules/.astro/mdx-rs',
		parallelism: 1,
	},
};

async function benchmarkProcessor(config, label, iterations = 100) {
	console.log(`📊 Benchmarking: ${label}`);
	console.log(`   Iterations: ${iterations}`);

	try {
		// Create processor
		const processor = await createMarkdownProcessorRouter(config);

		// Warm up
		await processor.render(sampleContent, {
			frontmatter: { title: 'Warmup' },
		});

		// Measure memory before
		const memBefore = process.memoryUsage();

		// Benchmark
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			await processor.render(sampleContent, {
				frontmatter: {
					title: `Test ${i}`,
					iteration: i,
				},
			});
		}

		const end = performance.now();
		const memAfter = process.memoryUsage();

		const duration = end - start;
		const avgTime = duration / iterations;
		const throughput = iterations / (duration / 1000);
		const memUsed = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;

		console.log(`   ⏱️  Total time: ${Math.round(duration)}ms`);
		console.log(`   📈 Average: ${avgTime.toFixed(2)}ms per file`);
		console.log(`   🚀 Throughput: ${Math.round(throughput)} files/sec`);
		console.log(`   💾 Memory used: ${memUsed.toFixed(1)}MB`);
		console.log('');

		return {
			duration,
			avgTime,
			throughput,
			memUsed,
			success: true,
		};
	} catch (error) {
		console.log(`   ❌ Error: ${error.message}`);
		console.log('');
		return {
			duration: Infinity,
			avgTime: Infinity,
			throughput: 0,
			memUsed: 0,
			success: false,
			error: error.message,
		};
	}
}

async function runBenchmarks() {
	const iterations = process.argv.includes('--quick') ? 10 : 100;

	console.log(`Running ${iterations} iterations per test...\n`);

	// Test configurations
	const tests = [
		{
			config: { ...baseConfig, experimentalRs: false },
			label: 'JavaScript Compiler (Baseline)',
		},
		{
			config: {
				...baseConfig,
				experimentalRs: true,
				rsOptions: { ...baseConfig.rsOptions, parallelism: 1 },
			},
			label: 'Rust Compiler (Single Thread)',
		},
		{
			config: {
				...baseConfig,
				experimentalRs: true,
				rsOptions: { ...baseConfig.rsOptions, parallelism: 4 },
			},
			label: 'Rust Compiler (4 Threads)',
		},
	];

	const results = [];

	for (const test of tests) {
		const result = await benchmarkProcessor(test.config, test.label, iterations);
		results.push({ ...result, label: test.label });
	}

	// Print comparison
	console.log('📈 Performance Comparison');
	console.log('========================');

	const baseline = results.find((r) => r.label.includes('JavaScript'));

	if (baseline && baseline.success) {
		for (const result of results) {
			if (!result.success) {
				console.log(`${result.label}: ❌ Failed - ${result.error}`);
				continue;
			}

			const speedup = baseline.avgTime / result.avgTime;
			const throughputGain = result.throughput / baseline.throughput;

			console.log(`${result.label}:`);
			console.log(`  Average Time: ${result.avgTime.toFixed(2)}ms`);
			console.log(`  Speedup: ${speedup.toFixed(1)}x`);
			console.log(
				`  Throughput: ${Math.round(result.throughput)} files/sec (${throughputGain.toFixed(1)}x)`,
			);
			console.log(`  Memory: ${result.memUsed.toFixed(1)}MB`);
			console.log('');
		}

		// Find best performer
		const successfulResults = results.filter((r) => r.success);
		if (successfulResults.length > 1) {
			const fastest = successfulResults.reduce((best, current) =>
				current.avgTime < best.avgTime ? current : best,
			);

			const speedup = baseline.avgTime / fastest.avgTime;
			console.log(`🏆 Winner: ${fastest.label}`);
			console.log(`   ${speedup.toFixed(1)}x faster than baseline`);
			console.log(`   ${Math.round(fastest.throughput)} files/sec throughput`);
		}
	} else {
		console.log('❌ Baseline test failed, cannot compare results');

		for (const result of results) {
			if (result.success) {
				console.log(`${result.label}: ✅ ${result.avgTime.toFixed(2)}ms avg`);
			} else {
				console.log(`${result.label}: ❌ ${result.error}`);
			}
		}
	}

	console.log('\\n✨ Benchmark complete!');
	console.log('\\n💡 Tips:');
	console.log('  - Use --quick for faster testing (10 iterations)');
	console.log('  - Ensure @mdx-js/mdx-rs is installed for Rust tests');
	console.log('  - Higher parallelism helps with many files');
}

// Error handling
process.on('unhandledRejection', (error) => {
	console.error('\\n❌ Unhandled error:', error.message);
	process.exit(1);
});

// Run benchmarks
runBenchmarks().catch(console.error);
