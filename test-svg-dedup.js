#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧪 Testing SVG Deduplication Fix');
console.log('================================\n');

// Test directory
const testDir = join(__dirname, 'svg-dedup-test');

// Clean up any existing test
try {
  rmSync(testDir, { recursive: true, force: true });
} catch {}

console.log('1️⃣ Setting up test project...');

// Create test project structure
mkdirSync(testDir);
mkdirSync(join(testDir, 'src'));
mkdirSync(join(testDir, 'src', 'assets'));
mkdirSync(join(testDir, 'src', 'components'));
mkdirSync(join(testDir, 'src', 'pages'));
mkdirSync(join(testDir, 'public'));

// Copy the same SVG file to multiple locations to test deduplication
const originalSvg = readFileSync(join(__dirname, 'examples', 'basics', 'src', 'assets', 'astro.svg'), 'utf-8');

// Create identical SVG files with different names/locations
writeFileSync(join(testDir, 'src', 'assets', 'logo1.svg'), originalSvg);
writeFileSync(join(testDir, 'src', 'assets', 'logo2.svg'), originalSvg);
writeFileSync(join(testDir, 'src', 'assets', 'logo3.svg'), originalSvg);
writeFileSync(join(testDir, 'public', 'logo4.svg'), originalSvg);

// Create a slightly different SVG to ensure it's NOT deduplicated
const modifiedSvg = originalSvg.replace('fill="#17191E"', 'fill="#FF0000"');
writeFileSync(join(testDir, 'src', 'assets', 'logo-different.svg'), modifiedSvg);

console.log('2️⃣ Creating test components...');

// Create Astro components that use SVGs in different ways
writeFileSync(join(testDir, 'src', 'components', 'TestSvgImports.astro'), `---
// Test different SVG import methods
import Logo1 from '../assets/logo1.svg';
import Logo2 from '../assets/logo2.svg';
import Logo3 from '../assets/logo3.svg';
import LogoDifferent from '../assets/logo-different.svg';
import { Image } from 'astro:assets';
---

<div class="svg-test">
  <h2>SVG Deduplication Test</h2>
  
  <!-- ESM Component imports (should be deduplicated) -->
  <div class="esm-imports">
    <h3>ESM Component Imports</h3>
    <Logo1 width="50" height="20" />
    <Logo2 width="50" height="20" />
    <Logo3 width="50" height="20" />
    <LogoDifferent width="50" height="20" />
  </div>
  
  <!-- Image component usage (should be deduplicated) -->
  <div class="image-components">
    <h3>Image Component Usage</h3>
    <Image src={Logo1} alt="Logo 1" width="50" height="20" />
    <Image src={Logo2} alt="Logo 2" width="50" height="20" />
    <Image src={Logo3} alt="Logo 3" width="50" height="20" />
    <Image src={LogoDifferent} alt="Different Logo" width="50" height="20" />
  </div>
  
  <!-- Public directory reference -->
  <div class="public-refs">
    <h3>Public Directory Reference</h3>
    <img src="/logo4.svg" alt="Logo 4" width="50" height="20" />
  </div>
</div>

<style>
  .svg-test { padding: 20px; }
  .svg-test > div { margin: 20px 0; }
  h3 { color: #666; }
</style>
`);

writeFileSync(join(testDir, 'src', 'pages', 'index.astro'), `---
import TestSvgImports from '../components/TestSvgImports.astro';
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width" />
    <title>SVG Deduplication Test</title>
  </head>
  <body>
    <main>
      <h1>SVG Deduplication Test Page</h1>
      <TestSvgImports />
    </main>
  </body>
</html>
`);

// Create astro config
writeFileSync(join(testDir, 'astro.config.mjs'), `import { defineConfig } from 'astro/config';

export default defineConfig({
  // Enable build optimizations to test deduplication
  build: {
    // Enable asset inlining for smaller assets
    assetsInlineLimit: 0, // Force all assets to be emitted as separate files
  }
});
`);

// Create package.json
writeFileSync(join(testDir, 'package.json'), JSON.stringify({
  "name": "svg-dedup-test",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "file:../packages/astro"
  }
}, null, 2));

console.log('3️⃣ Installing dependencies...');
try {
  execSync('pnpm install', { cwd: testDir, stdio: 'inherit' });
} catch (error) {
  console.error('Failed to install dependencies:', error.message);
  process.exit(1);
}

console.log('4️⃣ Building project...');
try {
  execSync('pnpm run build', { cwd: testDir, stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

console.log('5️⃣ Analyzing build output...');

// Analyze the dist directory for SVG files
try {
  const distAssets = execSync('find dist -name "*.svg" | head -20', { cwd: testDir, encoding: 'utf-8' });
  const svgFiles = distAssets.trim().split('\n').filter(Boolean);
  
  console.log('\n📊 Build Analysis:');
  console.log('==================');
  console.log(`Total SVG files in dist: ${svgFiles.length}`);
  
  if (svgFiles.length > 0) {
    console.log('SVG files found:');
    svgFiles.forEach(file => console.log(`  - ${file}`));
  }
  
  // Expected results:
  // - Without deduplication: ~4 identical SVG files + 1 different = 5 total
  // - With deduplication: ~1 unique SVG file + 1 different = 2 total
  
  if (svgFiles.length <= 2) {
    console.log('\n✅ SUCCESS: SVG deduplication appears to be working!');
    console.log('   Expected 2 or fewer SVG files (1 unique + 1 different)');
  } else if (svgFiles.length > 4) {
    console.log('\n❌ FAILURE: SVG deduplication may not be working');
    console.log('   Found more than 4 SVG files, suggesting no deduplication');
  } else {
    console.log('\n⚠️  PARTIAL: Some deduplication may be occurring');
    console.log('   Found 3-4 SVG files, investigate further');
  }
  
} catch (error) {
  console.error('Failed to analyze build output:', error.message);
}

// Check bundle size
try {
  const bundleSize = execSync('du -sh dist', { cwd: testDir, encoding: 'utf-8' });
  console.log(`\nBundle size: ${bundleSize.trim()}`);
} catch {}

console.log('\n6️⃣ To manually inspect:');
console.log(`   cd ${testDir}`);
console.log('   pnpm run dev  # Start dev server');
console.log('   ls -la dist/  # Check build output');

console.log('\n🧪 Test completed!');