import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  // 1. アダプターの設定
  adapter: netlify(),
  
  // 2. 出力モードの設定
  output: 'static',
  
  // 3. (オプション) 画像処理の挙動を固定する
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp' // またはデフォルト
    }
  }
});
