---
layout: ~/layouts/MainLayout.astro
title: クイックスタート
lang: ja
---

```shell
# 必須条件: Node.jsが12.20.0+、14.13.1+、または16+であることを確認する。
node --version

# 新しいプロジェクトディレクトリを作成し、その中に直接移動します
mkdir my-astro-project && cd $_

# 必要なファイルの準備
npm init astro

# 依存関係のインストール
npm install

# 開発を始めよう
npm run dev

# 準備ができたら、`dist/`に静的サイトを構築します。
npm run build
```

はじめてAstroをインストールして使用する場合は、[インストールガイド](/installation)をご覧ください。

サンプルを見ながら学びたいという方は、GitHubにある[全サンプル](https://github.com/snowpackjs/astro/tree/main/examples)をご覧ください。 `npm init astro -- --template "EXAMPLE_NAME"` を実行すれば、これらのサンプルをローカルにチェックアウトできます。

## プロジェクトの開始

ターミナルでプロジェクトのディレクトリに移動し、次のコマンドを入力します。

```bash
npm run dev
```

これでAstroは、 [http://localhost:3000](http://localhost:3000)で、アプリケーションの提供を開始します。このURLをブラウザで開くと、Astroの「Hello, World」が表示されるはずです。

サーバーは、あなたの`src/`ディレクトリにあるファイルの変更を常に監視しているので、開発中に変更してもアプリケーションを再起動する必要はありません。

## プロジェクトのビルド

プロジェクトをビルドするには、あなたのディレクトリ内で、ターミナルに次のビルドコマンドを入力します。

```bash
npm run build
```

このコマンドを実行すると、Astroはサイトを構築し、ディスクに直接保存するように指示します。これで、`dist/`ディレクトリにアプリケーションができあがりました。

## プロジェクトのデプロイ

Astroのサイトは静的なので、お好みのホストにデプロイできます。

- [AWS S3 bucket](https://aws.amazon.com/s3/)
- [Google Firebase](https://firebase.google.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)
- もっと詳しいAstroのデプロイについては、[デプロイガイド](/guides/deploy)をご覧ください。

## 次のステップ

これで開発を始める準備が整いました。

次のステップでは、Astroの仕組みをより深く理解することをオススメします。これらのドキュメントを探索することを検討してみてください。

📚 Astroのプロジェクト構造については、[プロジェクト構造ガイド](/core-concepts/project-structure)をご覧ください。

📚 Astroのコンポーネント構文については、[Astroコンポーネントガイド](/core-concepts/astro-components)を参照してください。

📚 Astroのファイルベースのルーティングについては、[ルーティングガイド](/core-concepts/astro-pages)を参照してください。
