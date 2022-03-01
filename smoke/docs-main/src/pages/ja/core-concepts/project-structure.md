---
layout: ~/layouts/MainLayout.astro
title: ディレクトリ構成
description: Astroを使ったプロジェクトのディレクトリ構成方法を紹介します。
---

Astroにはプロジェクトのための推奨ディレクトリ構成が含まれています。すべてのAstroプロジェクトは次のディレクトリとファイルが必要です。

- `src/*` - プロジェクトソースコード（コンポーネント、ページなど）
- `public/*` - コード以外のアセット（フォント、アイコンなど）
- `package.json` - プロジェクトマニフェスト

新しいプロジェクトのもっとも簡単なセットアップ方法は `npm init astro` です。
自動（`npm init astro`）、または手動でのプロジェクトのセットアップチュートリアルは、[インストールガイド](/ja/installation)を確認してください。

## ディレクトリ構成

```
├── src/
│   ├── components/
│   ├── layouts/
│   └── pages/
│       └── index.astro
├── public/
└── package.json
```

### `src/`

srcディレクトリには、プロジェクトのソースコードのほとんどが格納されています。これには以下が含まれます。

- [Astroコンポーネント](/en/core-concepts/astro-components)
- [ページ](/en/core-concepts/astro-pages)
- [レイアウト](/en/core-concepts/layouts)
- [フロントエンドJSコンポーネント](/en/core-concepts/component-hydration)
- [スタイル（CSS、Sass）](/en/guides/styling)
- [Markdown](/en/guides/markdown-content)

これらのファイルがどのように処理され、最適化され、最終的なサイト構築にバンドルされるかは、Astroが完全にコントロールします。一部のファイル（Astroコンポーネントなど）は、そのままブラウザに表示されず、HTMLに変換されます。その他のファイル（CSSなど）は、ブラウザに送信されますが、サイトの使用方法によっては、他のCSSファイルとバンドルされます。

### `src/components`

[コンポーネント](/en/core-concepts/astro-components)は、HTMLページで再利用可能なUIの単位です。このディレクトリにコンポーネントを置くことが推奨されています（必須ではありません）。このディレクトリ内でどのように整理するかは自由です。

Astro以外のUIコンポーネント（React、Preact、Svelte、Vueなど）も、`src/components`ディレクトリに格納します。Astroでは、パーシャルハイドレーションでフロントエンドのコンポーネントを有効にしていない限り、すべてのコンポーネントを自動的にHTMLに変換します。

### `src/layouts`

[レイアウト](/en/core-concepts/layouts)は、HTMLページのレイアウトのための再利用可能なコンポーネントです。レイアウトコンポーネントはこのディレクトリに置くことが推奨されています（必須ではありません）。このディレクトリ内でどのように整理するかは自由です。

### `src/pages`

[ページ](/en/core-concepts/astro-pages)には、ウェブサイトのすべてのページ（`.astro`と`.md`をサポート）が格納されています。ページをこのディレクトリに置くことは**必須**です。

### `public/`

ほとんどのユーザーは、最終的なビルドでAstroが適切に処理して最適化できるように、大部分のファイルを`src/`ディレクトリに置きます。これに対して、`public/`ディレクトリは、Astroのビルドプロセスの外に置かれるファイルのための場所です。

publicディレクトリにファイルを置いても、Astroでは処理されません。代わりに、そのままビルドディレクトリにコピーされます。これは、画像やフォントなどのアセットや、`robots.txt`や`manifest.webmanifest`などの特定のファイルを含める場合に便利です。
