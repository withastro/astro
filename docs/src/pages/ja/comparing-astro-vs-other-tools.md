---
layout: ~/layouts/MainLayout.astro
title: Astro vs. X
description: Astroと他の静的サイトジェネレーター（Gatsby、Next.js、Nuxt、Hugo、Eleventyなど）の比較
lang: ja
---

よく、「Astro は、私が気に入ってる静的サイトジェネレーターの **\_\_\_\_** と比べてどうですか？」と聞かれます。このガイドは、いくつかの人気の静的サイトジェネレーターと Astro の代わりに使えるツールについて、その質問に答えるために書かれました。

もし、お気に入りの静的サイトジェネレーターがここに掲載されていない場合は、 [Discord で聞いてみてください](https://astro.build/chat)。

## プロジェクトの状況

プロジェクトの進捗状況について簡単に説明します。**Astro はまだベータ版です**。 ここに掲載されている多くのツールはもっと成熟しており、中には Astro より 12 年以上先行しているものもあります。

Astro にはまだいくつかの機能が欠けており、いくつかの API もまだ完成していません。しかし、バグの観点からは安定していると考えられていて、すでにいくつかの本番用 Web サイトが Astro を使って構築されています。これは、Astro を選択する際の重要なポイントとなるでしょう。

## Docusaurus vs. Astro

[Docusaurus](https://docusaurus.io/) は、人気のあるドキュメントサイト生成ツールです。 Docusaurus は React を使って Web サイトの UI を生成しますが、Astro は React、Vue.js、Svelte、そして生の HTML テンプレートをサポートしています。

Docusaurus は、ドキュメント Web サイトを構築するために設計されていて、Astro にはない、ドキュメントに特化した Web サイト機能がいくつか組み込まれています。その代わり、Astro では、ドキュメントに特化した機能を、サイトに使用できる公式の[`docs`](https://github.com/snowpackjs/astro/tree/main/examples/docs)テーマを通じて提供しています。この Web サイトは、そのテンプレートを使って構築されています。

### Docusaurus と Astro のパフォーマンス比較

ほとんどの場合、Astro の Web サイトは Docusaurus の Web サイトよりも大幅に速く読み込まれます。これは、Astro がページ内の不要な JavaScript を自動的に外し、必要なコンポーネントのみをハイドレーションするためです。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。

Docusaurus はパーシャルハイドレーションに対応しておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションするようになっています。これにより、ページの読み込みが遅くなり、Web サイトのパフォーマンスが低下します。Docusaurus では、この動作を無効にする方法はありません。

### ケーススタディ：ドキュメントサイトの構築

[docusaurus.io/docs](https://docusaurus.io/docs) は、Docusaurus で構築された Docusaurus の公式ドキュメントサイトです。このサイトは、Astro の公式ドキュメントサイトと比較しても、十分に似たデザインと機能を提供しています。これにより、2 つのサイトビルダーを**大雑把に実際のサイト**で比較できます。

- **Docusaurus のパフォーマンススコア**: 100 点満点中 61 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocusaurus.io%2Fdocs)
- **Astro のパフォーマンススコア**: 100 点満点中 99 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このパフォーマンス差の大きな理由の 1 つは、Astro の JavaScript ペイロードが小さいことです。
[docusaurus.io/docs](https://docusaurus.io/docs)が最初のページ読み込み時に**238kb**の JavaScript をロードするのに対し、[docs.astro.build](https://docs.astro.build)は最初の読み込み後に**78.7kb**（全体で 67％の JavaScript 削減）の JavaScript をロードします。

## Elder.js vs. Astro

[Elder.js](https://elderguide.com/tech/elderjs/) は、Svelte のために作られたこだわりの強い静的サイトビルダーです。

Elder.js は Svelte を使って Web サイトをレンダリングします。Astro はより柔軟で、人気のあるコンポーネントライブラリ（React、Preact、Vue、Svelte、Solid など）や、HTML+JSX に似た Astro の HTML ライクなコンポーネント構文を使って UI を自由に構築できます。

Elder.js は、[パーシャルハイドレーション](/core-concepts/component-hydration)をサポートするサイトビルダーとして、このリストの中でもユニークな存在です。Astro も Elder.js も、ページから不要な JavaScript を自動的に外し、必要な個々のコンポーネントだけをハイドレーションします。Elder のパーシャルハイドレーションの API は少し違っていて、Astro は Elder.js がサポートしていないいくつかの機能をサポートしています（`client:media`など）。しかし、パフォーマンス的には、どちらのプロジェクトも非常に似通ったサイトを構築できます。

Elder.js は独自のルーティングを採用しており、新しい開発者には馴染みがないかもしれません。Astro は[ファイルベースのルーティング](/core-concepts/routing)を採用していて、Next.js や SvelteKit、または Eleventy のような静的サイトビルダーを使っている人には馴染みがあるでしょう。

Elder.js は、大規模な Web サイトで動作するように設計されていて、20,000 ページ程度の Web サイトを（手頃な VM 上で）10 分以内に構築できると謳っています。Astro は、記事執筆時点では、1,000 ページを 66 秒で構築していますが、20,000 ページ以上のプロジェクトではまだテストされていません。Astro はまだ初期のベータ版であり、Elder.js のビルド速度に匹敵することが Astro v1.0 の目標です。

Elder.js は、静的サイト生成(SSG)とサーバーサイドレンダリング(SSR)の両方をサポートしています。現在、Astro は静的サイト生成(SSG)のみをサポートしています。

## Eleventy vs. Astro

[Eleventy](https://www.11ty.dev/) は、Node.js を採用した人気の高い静的サイトビルダーです。

Eleventy は、いくつかの [古い HTML テンプレート言語](https://www.11ty.dev/docs/languages/) を使用して Web サイトをレンダリングします。サポートしているテンプレート言語には、Nunjucks、Liquid、Pug、EJS などがあります。Astro では、お気に入りの UI コンポーネントライブラリ（React、Preact、Vue、Svelte など）や、HTML + JSX に似た、組み込みのコンポーネント構文を使ってページを作成できます。 Eleventy は、モダンな UI コンポーネントを使った HTML のテンプレート化には対応していません。

### Eleventy と Astro のパフォーマンス比較

Eleventy のコンセプトは、Astro の「クライアントサイドの JavaScript を最小限にする」という Web 開発のアプローチと一致しています。Eleventy と Astro は、どちらも同様に、デフォルトでは JavaScript を使用しないパフォーマンスを基本として提供します。

Eleventy は、JavaScript を完全に避けることでこれを実現しています。Eleventy のサイトは、往々にして JavaScript をほとんど、あるいはまったく使わずに書かれています。これは、クライアントサイドの JavaScript が必要になったときに問題になります。Eleventy のために独自のアセットビルドパイプラインを作成することは、あなた次第です。そのため、バンドルやミニファイなどの複雑な最適化を自分で設定しなければならず、時間がかかります。

これに対して、Astro は、クライアントサイドの JavaScript と CSS を自動的に構築します。Astro では、ページ内の不要な JavaScript を自動的に外し、必要な個々のコンポーネントのみをハイドレーションします。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。この機能は、Eleventy でも自分で用意すれば実現可能ですが、Astro では、デフォルトで組み込まれています。

## Gatsby vs. Astro

[Gatsby](https://www.gatsbyjs.com/)は、React 向けの人気の Web サイト＆アプリケーションフレームワークです。

Gatsby は React を使って Web サイトをレンダリングします。Astro はより柔軟で、人気のあるコンポーネントライブラリ（React、Preact、Vue、Svelte、Solid など）や、HTML+JSX に似た Astro の HTML ライクなコンポーネント構文を使って UI を自由に構築できます。

Gatsby v4 は、インクリメンタル・リビルドによる静的サイト生成 (SSG)、Deferred Static Generation (DSG)、サーバーサイドレンダリング (SSR)のすべてをサポートしています。現在、Astro は静的サイト生成（SSG）のみをサポートしています。

Gatsby では、サイトのすべてのコンテンツを扱うために、カスタムの GraphQL API が必要です。開発者の中にはこのモデルを好む人もいますが、Gatsby に対する一般的な批判は、このモデルが複雑になりすぎて、とくにサイトの成長に伴って維持するのが難しくなるというものです。Astro では、GraphQL を必要とせず、代わりに（`fetch()`やトップレベル`await`のような）使い慣れた API を提供し、データが必要とされる場所の近くでデータを読み込めます。

### Gastby と Astro のパフォーマンス比較

ほとんどの場合、Astro の Web サイトは、Gatsby の Web サイトよりも大幅に速く読み込まれます。これは、Astro がページから不要な JavaScript を自動的に外し、必要な個々のコンポーネントのみをハイドレーションするためです。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。

Gatsby はパーシャルハイドレーションをサポートしておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションするようになっています。これにより、ページの読み込みが遅くなり、Web サイトのパフォーマンスが低下します。Gatsby には、ページからすべての JavaScript を削除するための[コミュニティプラグイン](https://www.gatsbyjs.com/plugins/gatsby-plugin-no-javascript/)がありますが、これでは多くの Web サイトが壊れてしまいます。このプラグインを使うなら、各ページのインタラクティブ性について、「すべてか無か」の決断を迫られることになります。

Gatsby には素晴らしいプラグインエコシステムがあり、ニーズに応じて Gatsby をより良い選択にすることができます。[gatsby-plugin-image](https://www.gatsbyjs.com/plugins/gatsby-plugin-image/)は、画像の最適化のための人気のあるプラグインで、画像を多用する Web サイトには Gatsby が適しているかもしれません。

### ケーススタディ：ドキュメントサイトの構築

[gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/) は、Gatsby で構築された Gatsby の公式ドキュメントサイトです。この Web サイトは、Astro の公式ドキュメント Web サイトと比較して、十分に似たデザインと機能セットを提供しています。これにより、この一般的なユースケースにおける、2 つのサイトビルダーの**大雑把に実際のサイト**での比較が可能になりました。

- **Gatsby パフォーマンススコア**: 100 点満点中 64 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fwww.gatsbyjs.com%2Fdocs%2Fquick-start%2F)
- **Astro パフォーマンススコア**: 100 点満点中 99 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このパフォーマンス差の大きな理由の 1 つは、Astro の JavaScript ペイロードの小ささです。[gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/)では、最初のページ読み込み時に**417kb**の JavaScript をロードするのに対し、[docs.astro.build](https://docs.astro.build)では、最初の読み込み後に**78.7kb**（全体で 81%の JavaScript 削減）の JavaScript をロードします。

## Hugo vs. Astro

[Hugo](https://gohugo.io/) は、人気のある静的サイトジェネレーターで、Go で書かれています。

Hugo は独自の[テンプレート言語](https://gohugo.io/templates/introduction/)を使って Web サイトを作成します。Astro では、お気に入りの UI コンポーネントライブラリ（React、Preact、Vue、Svelte など）や、HTML+JSX に似た組み込みのコンポーネント構文を使ってページを作成できます。Hugo は、モダンな UI コンポーネントを使った HTML のテンプレート化をサポートしていません。

### Hugo と Astro のパフォーマンスの比較

Hugo のコンセプトは、Astro の「クライアントサイドの JavaScript を最小限にする」という Web 開発のアプローチと一致しています。Hugo と Astro は、どちらも同様に、デフォルトで JavaScript を使用しないパフォーマンスを基本として提供します。

Hugo も Astro も、JavaScript のビルド、バンドル、ミニファイをサポートします。Astro は、ページから不要な JavaScript を自動的に外し、必要な個々のコンポーネントのみをハイドレーションします。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。Hugo でもこの機能を実現できますが、Astro ではデフォルトでこの機能が組み込まれています。

## Jekyll vs. Astro

[Jekyll](https://jekyllrb.com/) は、人気の高い静的サイトジェネレーターで、Ruby で書かれています。

Jekyll は、[Liquid と呼ばれる古いテンプレート言語](https://jekyllrb.com/docs/liquid/)を使って Web サイトをレンダリングします。Astro は、お気に入りの UI コンポーネントライブラリ（React、Preact、Vue、Svelte など）や、HTML + JSX に似た組み込みのコンポーネント構文を使ってページを作成できます。Jekyll は、モダンな UI コンポーネントを使った HTML のテンプレート化をサポートしていません。

### Jekyll と Astro のパフォーマンス比較

Jekyll のコンセプトは、Astro の「クライアントサイドの JavaScript を最小限にする」という Web 開発アプローチと一致しています。Jekyll と Astro は、どちらも同じように、デフォルトで JavaScript を使用しないパフォーマンスを基本として提供します。

Jekyll は、JavaScript を完全に避けることでこれを実現しています。Jekyll のサイトは、往々にして JavaScript をほとんど、あるいはまったく使わずに書かれていて、代わりにサーバーサイドでの HTML 生成を推進しています。これは、クライアントサイドの JavaScript が必要になったとき、問題になります。Jekyll のために独自のビルドパイプラインを作成するのはあなた次第です。そのため、バンドルやミニファイなどの最適化を自分で設定しなければならず、手間がかかります。

これに対して、Astro は、クライアントサイドの JavaScript を自動的に構築します。Astro では、必要最低限の JavaScript のみを、最小化、バンドル、最適化してブラウザに送信します。これは、Jekyll でも実現可能ですが、Astro ではデフォルトで組み込まれています。

## SvelteKit vs. Astro

[SvelteKit](https://kit.svelte.dev/) は、Svelte 用の Web サイト＆アプリケーションフレームワークとして人気があります。

SvelteKit は、Svelte を使って Web サイトを生成します。Astro はより柔軟で、人気のあるコンポーネントライブラリ（React、Preact、Vue、Svelte、Solid など）や、HTML+JSX に似た Astro の HTML ライクなコンポーネント構文を使って UI を自由に構築できます。

SvelteKit も Astro も、Web サイトを構築するためのフレームワークです。SvelteKit は動的な Web サイト（ダッシュボードや受信トレイなど）に適しており、Astro は静的な Web サイト（コンテンツや e コマースサイトなど）に適しています。

SvelteKit は、静的サイト生成（SSG）とサーバーサイドレンダリング（SSR）の両方をサポートしています。現在、Astro は静的サイト生成（SSG）のみをサポートしています。

### SvelteKit と Astro のパフォーマンス比較

ほとんどの場合、Astro の Web サイトは SvelteKit の Web サイトよりも速く読み込まれます。これは、Astro がページから不要な JavaScript を自動的に取り除き、必要な個々のコンポーネントのみをハイドレーションするためです。この機能は、[パーシャルハイドレーション](/core-concepts/component-hydration)と呼ばれています。

SvelteKit はパーシャルハイドレーションに対応しておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションするようになっています。これにより、ページの読み込みが遅くなり、Web サイトのパフォーマンスが低下します。SvelteKit は、[ページレベルの静的なゼロ JavaScript ページ](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate)をサポートしています。しかし、ページ上の個々のコンポーネントをハイドレートするためのサポートは予定されていません。このため、各ページのインタラクティブ性については、「すべてか無か」の判断を迫られることになります。

### ケーススタディ：ドキュメントサイトの構築

[kit.svelte.dev](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate) は、SvelteKit で構築された SvelteKit の公式ドキュメントサイトです。この Web サイトは、Astro の公式ドキュメント Web サイトと比較して、十分に似たデザインと機能を提供しています。これにより、この一般的なユースケースにおける 2 つのサイトビルダーの**大雑把に実際のサイト**での比較ができます。

今回テストした 2 つのサイトの注目すべき違いが 1 つあります。SvelteKit のドキュメントは 1 つのページとして提供されるのに対し、Astro のドキュメントは複数のページに分かれています。この大きなコンテンツペイロードは、ツール自体とは関係なく、パフォーマンスに若干のマイナス影響を与えるはずです。

- **SvelteKit パフォーマンススコア**: 100 点満点中 92 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fkit.svelte.dev%2Fdocs)
- **Astro パフォーマンススコア**: 100 点満点中 99 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このテストでは、SvelteKit は Astro と同等のパフォーマンスを発揮しました。

## Next.js vs. Astro

[Next.js](https://nextjs.org/) は、React 用の Web サイト＆アプリケーションフレームワークとして人気があります。

Next.js は React を使って Web サイトをレンダリングします。Astro はより柔軟で、人気のあるコンポーネントライブラリ（React、Preact、Vue、Svelte、Solid など）や、HTML+JSX に似た Astro の HTML ライクなコンポーネント構文を使って UI を自由に構築できます。

Next.js も Astro も、Web サイトを構築するためのフレームワークです。Next.js はダッシュボードや受信トレイなどの動的な Web サイトに適しており、Astro はコンテンツや e コマースサイトなどの静的な Web サイトに適しています。

Next.js は静的サイト生成（SSG）とサーバーサイドレンダリング（SSR）の両方をサポートしています。現在、Astro は静的サイト生成（SSG）のみをサポートしています。

### Next.js と Astro のパフォーマンス比較

ほとんどの場合、Astro の Web サイトは Next.js の Web サイトよりも圧倒的に速く読み込まれます。これは、Astro がページから不要な JavaScript を自動的に取り除き、必要な個々のコンポーネントのみをハイドレーションするためです。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。

Next.js はパーシャルハイドレーションをサポートしておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションするようになっています。そのため、ページの読み込みが遅くなり、Web サイトのパフォーマンスが低下します。Next.js は、完全にスタティックな、JavaScript を使用しないページを[実験的にサポート](https://piccalil.li/blog/new-year-new-website/#heading-no-client-side-react-code) しています。しかし、ページ上の個々のコンポーネントをハイドレートするためのサポートは予定されていません。そのため、各ページのインタラクティブ性については、「すべてか無か」の判断を迫られることになります。

Next.js には画像を最適化する機能が組み込まれているため、画像を多用する Web サイトでは Next.js の方が適しているかもしれません。

### ケーススタディ：ドキュメントサイトの構築

[nextjs.org/docs](https://nextjs.org/docs/getting-started) は、Next.js で構築された公式の Next.js ドキュメントサイトです。この Web サイトは、Astro の公式ドキュメントサイトと比較しても、十分に似たデザインと機能を備えています。これにより、この一般的なユースケースにおける 2 つのサイトビルダーの**大雑把に実際のサイト**での比較ができます。

- **Next.js パフォーマンススコア**: 100 点満点中 59 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnextjs.org%2Fdocs%2Fgetting-started)
- **Astro パフォーマンススコア**: 100 点満点中 99 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このパフォーマンス差の大きな理由の 1 つは、Astro の JavaScript ペイロードの小ささです。
[nextjs.org/docs](https://nextjs.org/docs/getting-started)が最初のページ読み込み時に**463kb**の JavaScript をロードするのに対し、 [docs.astro.build](https://docs.astro.build)は最初の読み込み後に**78.7kb**（全体では 83％の JavaScript 削減）の JavaScript をロードします。

## Nuxt vs. Astro

[Nuxt](https://nuxtjs.org/) は、人気のある Vue の Web サイト＆アプリケーションフレームワークです。Next.js に似ています。

Nuxt は Vue を使って Web サイトを生成します。Astro はより柔軟で、人気のあるコンポーネントライブラリ（React、Preact、Vue、Svelte、Solid など）や、HTML+JSX に似た Astro の HTML ライクなコンポーネント構文を使って UI を自由に構築できます。

Nuxt も Astro も、Web サイトを構築するためのフレームワークです。Nuxt は動的な Web サイト（ダッシュボードや受信トレイなど）に最適で、Astro は静的な Web サイト（コンテンツや e コマースサイトなど）に最適です。

Nuxt は静的サイト生成（SSG）とサーバーサイドレンダリング（SSR）の両方をサポートしています。現在、Astro は静的サイト生成（SSG）のみをサポートしています。

### Nuxt と Astro のパフォーマンス比較

ほとんどの場合、Astro の Web サイトは Nuxt の Web サイトよりも圧倒的に速く読み込まれます。これは、Astro がページから不要な JavaScript を自動的に取り除き、必要な個々のコンポーネントのみをハイドレーションするためです。この機能は、[パーシャルハイドレーション](/core-concepts/component-hydration)と呼ばれています。

Nuxt はパーシャルハイドレーションに対応しておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションします。これにより、ページの読み込みが遅くなり、Web サイトのパフォーマンスが低下します。この動作を無効にする方法は、Nuxt にはありません。

Nuxt には優れた画像最適化機能が内蔵されているため、画像を多用する Web サイトでは Nuxt の方が適している場合があります。

### ケーススタディ：ドキュメントサイトの構築

[nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) は、Nuxt で構築された Nuxt の公式ドキュメントサイトです。この Web サイトは、Astro の公式ドキュメントサイトと比較しても、十分に似たデザインと機能を備えています。これにより、2 つのサイトビルダーを、この一般的なユースケースにおいて、**大雑把に実際のサイト**で比較できます。

- **Nuxt パフォーマンススコア**: 100 点満点中 48 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnuxtjs.org%2Fdocs%2F2.x%2Fget-started%2Finstallation)
- **Astro パフォーマンススコア**: 100 点満点中 99 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このパフォーマンスの差の大きな理由の 1 つは、Astro の JavaScript ペイロードの小ささです。
[nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation)が最初のページ読み込み時に **469kb** の JavaScript をロードするのに対し、 [docs.astro.build](https://docs.astro.build) は最初の読み込み後に **78.7kb**（83%減）の JavaScript をロードします。

## VuePress vs. Astro

[VuePress](https://vuepress.vuejs.org/guide/) は、Vue.js の作者が開発した、人気の高いドキュメント Web サイト生成ツールです。VuePress は Vue.js を使用して Web サイトの UI を生成し、Astro は React、Vue.js、Svelte、生の HTML テンプレートをサポートしています。

VuePress は、ドキュメントサイト用に設計されており、Astro ではサポートしていないドキュメントに特化した Web サイトの機能がいくつか組み込まれています。その代わり、Astro では、ドキュメントに特化した機能を公式の [`docs`](https://github.com/snowpackjs/astro/tree/main/examples/docs)テーマで提供しており、サイトに使用できます。この Web サイトは、そのテンプレートを使って作られています。

Vue.js の作者である Evan You 氏は現在、[VitePress](https://vitepress.vuejs.org/)という VuePress の新バージョンを開発しています。VuePress に代わるモダンなツールをお求めの方は、なぜ、VitePress がより良い選択肢なのか、[Evan 氏の投稿](https://github.com/snowpackjs/astro/issues/1159#issue-974035962)をご覧ください。

### VuePress と Astro のパフォーマンス比較

ほとんどの場合、Astro の Web サイトは VuePress の Web サイトよりも圧倒的に速く読み込まれます。これは、Astro がページから不要な JavaScript を自動的に外し、必要な個々のコンポーネントのみをハイドレーションするためです。この機能は、[パーシャルハイドレーション](/core-concepts/component-hydration)と呼ばれています。

VuePress はパーシャルハイドレーションに対応しておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションするようになっています。これにより、ページの読み込みが遅くなり、Web サイトのパフォーマンスが低下します。VuePress では、この動作を無効にする方法はありません。

### ケーススタディ：ドキュメントサイトの構築

[vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) は、VuePress で構築された、VuePress の公式ドキュメントサイトです。このサイトは、Astro の公式ドキュメントサイトと比較しても、十分に似たデザインと機能セットを提供しています。これにより、2 つのサイトビルダーを、この一般的なユースケースにおいて、**大雑把に実際のサイト**で比較できます。

- **Vuepress パフォーマンススコア**: 100 点満点中 63 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fvuepress.vuejs.org%2Fguide%2F)
- **Astro パフォーマンススコア**: 100 点満点中 99 点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このパフォーマンス差の大きな理由の 1 つは、Astro の JavaScript ペイロードの小ささです。[vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) が最初のページ読み込みで **166kb** の JavaScript をロードするのに対し、 [docs.astro.build](https://docs.astro.build)は最初の読み込み後に **78.7kb**（全体で 53％の JavaScript 削減）の JavaScript をロードします。

## Zola vs. Astro

Zola は、Rust を使った人気の高い高速な静的サイトジェネレーターです。

Zola は [Tera](https://tera.netlify.app/) を使って Web サイトを生成します。Astro は、お気に入りの UI コンポーネントライブラリ（React、Preact、Vue、Svelte など）や、HTML + JSX に似た組み込みのコンポーネント構文を使ってページを作成できます。Zola はモダンな UI コンポーネントを使った HTML のテンプレート化には対応していません。

### Zola と Astro のパフォーマンス比較

コンセプト的には、Zola は Astro の「クライアントサイドの JavaScript を最小限にする」という Web 開発のアプローチと一致しています。Zola と Astro は、どちらも似たような、デフォルトでは JavaScript を使用しないパフォーマンスを基本として提供します。

Astro は、JavaScript のビルド、バンドル、ミニファイをサポートしています。Zola では、JavaScript をバンドルして処理するために、webpack のような別のビルドツールを使用する必要があります。Astro では、ページから不要な JavaScript を自動的に外し、必要な個々のコンポーネントのみをハイドレーションします。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。Zola でもこの機能を実現することは可能ですが、Astro ではデフォルトでこの機能が組み込まれています。
