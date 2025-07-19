import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

console.log('🚀 MDX-rs Benchmark Tool');
console.log('=======================\n');

// Generate test content if it doesn't exist
if (!fs.existsSync('./src/pages/examples')) {
  console.log('📝 Generating test content...');
  execSync('node generate-content.js', { stdio: 'inherit' });
  console.log('');
}

// Count MDX files
const examplesDir = './src/pages/examples';
const mdxFiles = fs.readdirSync(examplesDir).filter(f => f.endsWith('.md'));
console.log(`📊 Found ${mdxFiles.length} MDX files to process\n`);

async function runBenchmark(config, label) {
  console.log(`⏱️  Running benchmark: ${label}`);
  
  // Create temporary config
  const configContent = \`// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig(${JSON.stringify(config, null, 2)});
\`;
  
  fs.writeFileSync('./astro.config.mjs.tmp', configContent);
  
  try {
    // Clean build directory
    if (fs.existsSync('./dist')) {
      fs.rmSync('./dist', { recursive: true });
    }
    
    const start = performance.now();
    
    // Run build with temporary config
    execSync('cp astro.config.mjs.tmp astro.config.mjs', { stdio: 'pipe' });
    execSync('npm run build', { stdio: 'pipe' });
    
    const end = performance.now();
    const duration = end - start;
    
    // Get build size
    const buildSize = getBuildSize('./dist');
    
    console.log(\`   ✅ Completed in \${Math.round(duration)}ms\`);
    console.log(\`   📦 Build size: \${(buildSize / 1024).toFixed(1)}KB\`);
    console.log(\`   ⚡ Speed: \${Math.round(mdxFiles.length / (duration / 1000))} files/sec\\n\`);
    
    return {
      duration,
      buildSize,
      filesPerSecond: mdxFiles.length / (duration / 1000),
    };
    
  } catch (error) {
    console.log(\`   ❌ Failed: \${error.message}\\n\`);
    return null;
  } finally {
    // Restore original config
    if (fs.existsSync('./astro.config.mjs.backup')) {
      fs.copyFileSync('./astro.config.mjs.backup', './astro.config.mjs');
    }
    if (fs.existsSync('./astro.config.mjs.tmp')) {
      fs.unlinkSync('./astro.config.mjs.tmp');
    }
  }
}

function getBuildSize(dir) {
  let size = 0;
  
  function calculateSize(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const itemPath = \`\${currentDir}/\${item}\`;
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        calculateSize(itemPath);
      } else {
        size += stat.size;
      }
    }
  }
  
  if (fs.existsSync(dir)) {
    calculateSize(dir);
  }
  
  return size;
}

async function main() {
  // Backup original config
  if (fs.existsSync('./astro.config.mjs')) {
    fs.copyFileSync('./astro.config.mjs', './astro.config.mjs.backup');
  }
  
  // Test configurations
  const configs = [
    {
      config: {
        experimental: { experimentalRs: false },
        markdown: { gfm: true, smartypants: true },
      },
      label: 'JavaScript Compiler (Baseline)',
    },
    {
      config: {
        experimental: { experimentalRs: true },
        markdown: {
          gfm: true,
          smartypants: true,
          rsOptions: {
            fallbackToJs: true,
            parallelism: 1,
          },
        },
      },
      label: 'Rust Compiler (Single Thread)',
    },
    {
      config: {
        experimental: { experimentalRs: true },
        markdown: {
          gfm: true,
          smartypants: true,
          rsOptions: {
            fallbackToJs: true,
            parallelism: 4,
          },
        },
      },
      label: 'Rust Compiler (4 Threads)',
    },
  ];
  
  const results = [];
  
  for (const { config, label } of configs) {
    const result = await runBenchmark(config, label);
    if (result) {
      results.push({ label, ...result });
    }
  }
  
  // Print comparison
  if (results.length >= 2) {
    console.log('📈 Performance Comparison');
    console.log('========================');
    
    const baseline = results[0];
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const speedup = i === 0 ? '1.0x (baseline)' : \`\${(baseline.duration / result.duration).toFixed(1)}x faster\`;
      
      console.log(\`\${result.label}:\`);
      console.log(\`  Build Time: \${Math.round(result.duration)}ms\`);
      console.log(\`  Performance: \${speedup}\`);
      console.log(\`  Throughput: \${Math.round(result.filesPerSecond)} files/sec\\n\`);
    }
    
    // Best performer
    const fastest = results.reduce((best, current) => 
      current.duration < best.duration ? current : best
    );
    
    console.log(\`🏆 Winner: \${fastest.label}\`);
    console.log(\`   Performance gain: \${(baseline.duration / fastest.duration).toFixed(1)}x faster than baseline\`);
  }
  
  // Restore original config
  if (fs.existsSync('./astro.config.mjs.backup')) {
    fs.copyFileSync('./astro.config.mjs.backup', './astro.config.mjs');
    fs.unlinkSync('./astro.config.mjs.backup');
  }
  
  console.log('\\n✨ Benchmark complete!');
}

main().catch(console.error);