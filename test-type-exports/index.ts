import type { BundledLanguage } from 'astro';

const lang: BundledLanguage = 'ts'; // ✅ should pass
const wrongLang: BundledLanguage = 'invalid'; // ❌ should fail
