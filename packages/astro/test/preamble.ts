process.env.ASTRO_TEST_PREAMBLE = '1';

// Build all mega fixtures
await import('./preludes/standard-static.prelude.ts');
await import('./preludes/standard-framework-slots.prelude.ts');

console.log('Preamble: all mega fixtures built.');
