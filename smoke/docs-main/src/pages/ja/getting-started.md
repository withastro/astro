---
layout: ~/layouts/MainLayout.astro
title: はじめに
---

Astro（アストロ）は、モダンな静的サイトジェネレーターです。Astro については、[ホームページ](https://astro.build/)や[リリース記事](https://astro.build/blog/introducing-astro)をご覧ください。このページでは、Astro のドキュメントおよび関連リソースの概要を紹介します。

Astro の簡単な概要を知りたい方は[ホームページ](https://astro.build/)をご覧ください。

## Astro を試す

もっとも簡単な Astro を試す方法は、あなたのマシンの新しいディレクトリで `npm init astro` を実行することです。新しい Astro プロジェクトを立ち上げる際には、CLI ウィザードがサポートしてくれます。

5 つの簡単なステップで Astro を使い始めるには、[クイックスタートガイド](/ja/quick-start)をご覧ください。

また、[インストールガイド](/ja/installation)では、Astro のセットアップ方法を詳しく解説しています。

## サンプルプロジェクト

サンプルを使って Astro を学びたい方は、GitHub にある[全サンプル](https://github.com/withastro/astro/tree/main/examples)をご覧ください。

これらのサンプルは、`--template` という CLI フラグを付けて `npm init astro` を実行すると、ローカルマシンでチェックアウトできます。また、 `--template` フラグは、サードパーティのコミュニティテンプレートもサポートしています。

```bash
# 公式テンプレートを使用して、initウィザードを実行
npm init astro -- --template [OFFICIAL_EXAMPLE_NAME].
# コミュニティテンプレートを使用して、initウィザードを実行
npm init astro -- --template [GITHUB_USER]/[REPO_NAME]を実行します。
npm init astro -- --template [GITHUB_USER]/[REPO_NAME]/path/to/example
```

### オンラインコードエディター

ブラウザで Astro を使ってみたいという方は、[astro.new](https://astro.new/)にある UI を使ってすぐに新しい Astro プロジェクトを立ち上げられます。

Stackblitz、CodeSandbox、Gitpod、GitHub Codespaces などのオンラインコードエディターでも Astro を試せます。[サンプル集](https://github.com/snowpackjs/astro/tree/main/examples)にあるサンプルの中の「Open in Stackblitz」リンクをクリックしてください。また、[ここをクリック](https://stackblitz.com/fork/astro)すると、[Stackblitz](https://stackblitz.com/fork/astro)で新しいプロジェクトを始められます。

## Astro を学ぶ

Astro には、さまざまなバックグラウンドを持った人が集まっており、学習スタイルもさまざまです。このセクションでは、より理論的なアプローチや実践的なアプローチなど、さまざまな学習スタイルをご紹介していますので、参考になれば幸いです。

- 実際にやってみて学びたいという方は、まず[サンプルライブラリ](https://github.com/withastro/astro/tree/main/examples)から始めてください。
- また、コンセプトを段階的に学びたい方は、[基本コンセプトとガイド](/core-concepts/project-structure)をご覧ください。

他の慣れない技術と同様、Astro にも若干の習得が必要です。しかし、練習と忍耐力があれば、すぐに使いこなせるようになること間違いなしでしょう。

### `.astro` 構文の学習

Astro の学習を始めると、多くのファイルに `.astro` という拡張子がついているのを目にします。これは**Astro コンポーネント構文**といって、Astro がテンプレートとして使用する HTML に似た特殊なファイル形式です。HTML や JSX の経験がある人には馴染みやすいように設計されています。

[Astro コンポーネント](/core-concepts/astro-components)のガイドでは、Astro コンポーネント構文を紹介していますので、これを参考にしてください。

### API リファレンス

このドキュメントセクションは、特定の Astro API の詳細を知りたい場合に役立ちます。たとえば、[設定リファレンス](/reference/configuration-reference)では、利用可能なすべての設定オプションがリストアップされています。[ビルトインコンポーネントリファレンス](/reference/builtin-components)では、`<Markdown />` や `<Code />` など、利用可能なすべてのコアコンポーネントがリストアップされています。

### バージョン管理されたドキュメント

このドキュメントは、常に最新の安定版の Astro を反映しています。v1.0 になったら、バージョン管理されたドキュメントを見れるようになる予定です。

## 情報を入手する

Astro チームからの最新情報は、[@astrodotbuild](https://twitter.com/astrodotbuild)の Twitter アカウントが公式に発信しています。

また、[Discord コミュニティ](https://astro.build/chat)の #announcements チャンネルにもリリースのお知らせを投稿しています。

すべてのリリースがブログ記事で紹介されるわけではありませんが、[Astro リポジトリの `CHANGELOG.md` ファイル](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md)には、すべてのリリースの詳細な変更履歴が記載されています。

## 何か足りない？

ドキュメントに何か足りないところがあったり、わかりにくいところを見つけたら、改善のための提案を[ドキュメントの Issue として提出してください](https://github.com/withastro/astro/issues/new/choose)。または [@astrodotbuild](https://twitter.com/astrodotbuild) の Twitter アカウントにつぶやいてください。皆様のご意見をお待ちしております。

## クレジット

このスタートアップガイドは、[React](https://reactjs.org/)のスタートアップガイドを元にしています。
