---
layout: ~/layouts/MainLayout.astro
title: はじめに
lang: ja
---

Astro（アストロ）は、モダンな静的サイトジェネレーターです。Astroについては、[ホームページ](https://astro.build/)や[リリース記事](https://astro.build/blog/introducing-astro)をご覧ください。このページでは、Astroのドキュメントおよび関連リソースの概要を紹介します。

Astroの簡単な概要を知りたい方は[ホームページ](https://astro.build/)をご覧ください。

## Astroを試す

もっとも簡単なAstroを試す方法は、あなたのマシンの新しいディレクトリで `npm init astro` を実行することです。新しいAstroプロジェクトを立ち上げる際には、CLIウィザードがサポートしてくれます。

5つの簡単なステップでAstroを使い始めるには、[クイックスタートガイド](/quick-start)をご覧ください。

また、[インストールガイド](/installation)では、Astroのセットアップ方法を詳しく解説しています。

## サンプルプロジェクト

サンプルを使ってAstroを学びたい方は、GitHubにある[全サンプル](https://github.com/snowpackjs/astro/tree/main/examples)をご覧ください。

これらのサンプルは、`--template` というCLIフラグを付けて `npm init astro` を実行すると、ローカルマシンでチェックアウトできます。また、 `--template` フラグは、サードパーティのコミュニティテンプレートもサポートしています。

```bash
# 公式テンプレートを使用して、initウィザードを実行
npm init astro -- --template [OFFICIAL_EXAMPLE_NAME].
# コミュニティテンプレートを使用して、initウィザードを実行
npm init astro -- --template [GITHUB_USER]/[REPO_NAME]を実行します。
npm init astro -- --template [GITHUB_USER]/[REPO_NAME]/path/to/example
```

### オンラインコードエディター

ブラウザでAstroを試してみたいという方は、オンラインコードエディターを利用できます。[CodeSandboxの「Hello World!」テンプレート](https://codesandbox.io/s/astro-template-hugb3)を試してみてください。

注：CodeSandboxでは、一部の機能（例：Fast Refresh）が現在制限されています。

## Astroを学ぶ

Astroには、さまざまなバックグラウンドを持った人が集まっており、学習スタイルもさまざまです。このセクションでは、より理論的なアプローチや実践的なアプローチなど、さまざまな学習スタイルをご紹介していますので、参考になれば幸いです。

- 実際にやってみて学びたいという方は、まず[サンプルライブラリ](https://github.com/snowpackjs/astro/tree/main/examples)から始めてください。
- また、コンセプトを段階的に学びたい方は、[基本コンセプトとガイド](/core-concepts/project-structure)をご覧ください。

他の慣れない技術と同様、Astroにも若干の習得が必要です。しかし、練習と忍耐力があれば、すぐに使いこなせるようになること間違いなしでしょう。

### `.astro` 構文の学習

Astroの学習を始めると、多くのファイルに `.astro` という拡張子がついているのを目にします。これは**Astroコンポーネント構文**といって、Astroがテンプレートとして使用するHTMLに似た特殊なファイル形式です。HTMLやJSXの経験がある人には馴染みやすいように設計されています。

[Astroコンポーネント](/core-concepts/astro-components)のガイドでは、Astroコンポーネント構文を紹介していますので、これを参考にしてください。

### APIリファレンス

このドキュメントセクションは、特定のAstro APIの詳細を知りたい場合に役立ちます。たとえば、[設定リファレンス](/reference/configuration-reference)では、利用可能なすべての設定オプションがリストアップされています。[ビルトインコンポーネントリファレンス](/reference/builtin-components)では、`<Markdown />` や `<Code />` など、利用可能なすべてのコアコンポーネントがリストアップされています。

### バージョン管理されたドキュメント

このドキュメントは、常に最新の安定版のAstroを反映しています。v1.0になったら、バージョン管理されたドキュメントを見れるようになる予定です。

## 情報を入手する

Astroチームからの最新情報は、[@astrodotbuild](https://twitter.com/astrodotbuild)のTwitterアカウントが公式に発信しています。

また、[Discordコミュニティ](https://astro.build/chat)の #announcements チャンネルにもリリースのお知らせを投稿しています。

すべてのリリースがブログ記事で紹介されるわけではありませんが、[Astroリポジトリの `CHANGELOG.md` ファイル](https://github.com/snowpackjs/astro/blob/main/packages/astro/CHANGELOG.md)には、すべてのリリースの詳細な変更履歴が記載されています。

## 何か足りない？

ドキュメントに何か足りないところがあったり、わかりにくいところを見つけたら、改善のための提案を[ドキュメントのIssueとして提出してください](https://github.com/snowpackjs/astro/issues/new/choose)。または [@astrodotbuild](https://twitter.com/astrodotbuild) のTwitterアカウントにつぶやいてください。皆様のご意見をお待ちしております。

## クレジット

このスタートアップガイドは、[React](https://reactjs.org/)のスタートアップガイドを元にしています。
