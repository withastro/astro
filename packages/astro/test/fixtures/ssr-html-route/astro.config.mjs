import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  // SSRモードを有効化
  output: 'server',
  // テスト実行用のシンプルなアダプター
  adapter: node({ mode: 'standalone' }),
});
