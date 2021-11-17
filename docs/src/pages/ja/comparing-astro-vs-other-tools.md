---
layout: ~/layouts/MainLayout.astro
title: Astro vs. X
description: Astroと他の静的サイトジェネレーター（Gatsby、Next.js。Nuxt、Hugo、Eleventyなど）の比較
lang: ja
---

よく、「Astroは、私が気に入ってる静的サイトジェネレーターの **\_\_\_\_** と比べてどうですか？」と聞かれます。このガイドは、いくつかの人気の静的サイトジェネレーターとAstroの代わりに使えるツールについて、その質問に答えるために書かれました。

もし、お気に入りの静的サイトジェネレーターがここに掲載されていない場合は、 [Discordで聞いてみてください](https://astro.build/chat)。

## プロジェクトの状況

プロジェクトの進捗状況について簡単に説明します。**Astroはまだベータ版です**。 ここに掲載されている多くのツールはもっと成熟しており、中にはAstroより12年以上先行しているものもあります。

Astroにはまだいくつかの機能が欠けており、いくつかのAPIもまだ完成していません。しかし、バグの観点からは安定していると考えられていて、すでにいくつかの本番用WebサイトがAstroを使って構築されています。これは、Astroを選択する際の重要なポイントとなるでしょう。

## Docusaurus vs. Astro

[Docusaurus](https://docusaurus.io/) は、人気のあるドキュメントサイト生成ツールです。 DocusaurusはReactを使ってWebサイトのUIを生成しますが、AstroはReact、Vue.js、Svelte、そして生のHTMLテンプレートをサポートしています。

Docusaurusは、ドキュメントWebサイトを構築するために設計されていて、Astroにはない、ドキュメントに特化したWebサイト機能がいくつか組み込まれています。その代わり、Astroでは、ドキュメントに特化した機能を、サイトに使用できる公式の[`docs`](https://github.com/snowpackjs/astro/tree/main/examples/docs)テーマを通じて提供しています。このWebサイトは、そのテンプレートを使って構築されています。

### DocusaurusとAstroのパフォーマンス比較

ほとんどの場合、AstroのWebサイトはDocusaurusのWebサイトよりも大幅に速く読み込まれます。これは、Astroがページ内の不要なJavaScriptを自動的に外し、必要なコンポーネントのみをハイドレーションするためです。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。

Docusaurusはパーシャルハイドレーションに対応しておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションするようになっています。これにより、ページの読み込みが遅くなり、Webサイトのパフォーマンスが低下します。Docusaurusでは、この動作を無効にする方法はありません。

### ケーススタディ：ドキュメントサイトの構築

[docusaurus.io/docs](https://docusaurus.io/docs) は、Docusaurusで構築されたDocusaurusの公式ドキュメントサイトです。このサイトは、Astroの公式ドキュメントサイトと比較しても、十分に似たデザインと機能を提供しています。これにより、2つのサイトビルダーを**大雑把に実際のサイト**で比較できます。

- **Docusaurusのパフォーマンススコア**: 100点満点中61点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocusaurus.io%2Fdocs)
- **Astroのパフォーマンススコア**: 100点満点中99点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このパフォーマンス差の大きな理由の1つは、AstroのJavaScriptペイロードが小さいことです。
[docusaurus.io/docs](https://docusaurus.io/docs)が最初のページ読み込み時に**238kb**のJavaScriptをロードするのに対し、[docs.astro.build](https://docs.astro.build)は最初の読み込み後に**78.7kb**（全体で67％のJavaScript削減）のJavaScriptをロードします。

## Elder.js vs. Astro

[Elder.js](https://elderguide.com/tech/elderjs/) は、Svelteのために作られたこだわりの強い静的サイトビルダーです。

Elder.jsはSvelteを使ってWebサイトをレンダリングします。Astroはより柔軟で、人気のあるコンポーネントライブラリ（React、Preact、Vue、Svelte、Solidなど）や、HTML+JSXに似たAstroのHTMLライクなコンポーネント構文を使ってUIを自由に構築できます。

Elder.jsは、[パーシャルハイドレーション](/core-concepts/component-hydration)をサポートするサイトビルダーとして、このリストの中でもユニークな存在です。AstroもElder.jsも、ページから不要なJavaScriptを自動的に外し、必要な個々のコンポーネントだけをハイドレーションします。ElderのパーシャルハイドレーションのAPIは少し違っていて、AstroはElder.jsがサポートしていないいくつかの機能をサポートしています（`client:media`など）。しかし、パフォーマンス的には、どちらのプロジェクトも非常に似通ったサイトを構築できます。

Elder.jsは独自のルーティングを採用しており、新しい開発者には馴染みがないかもしれません。Astroは[ファイルベースのルーティング](/core-concepts/routing)を採用していて、Next.jsやSvelteKit、またはEleventyのような静的サイトビルダーを使っている人には馴染みがあるでしょう。

Elder.jsは、大規模なWebサイトで動作するように設計されていて、20,000ページ程度のWebサイトを（手頃なVM上で）10分以内に構築できると謳っています。Astroは、記事執筆時点では、1,000ページを66秒で構築していますが、20,000ページ以上のプロジェクトではまだテストされていません。Astroはまだ初期のベータ版であり、Elder.jsのビルド速度に匹敵することがAstro v1.0の目標です。

Elder.jsは、静的サイト生成(SSG)とサーバーサイドレンダリング(SSR)の両方をサポートしています。現在、Astroは静的サイト生成(SSG)のみをサポートしています。

## Eleventy vs. Astro

[Eleventy](https://www.11ty.dev/) は、Node.jsを採用した人気の高い静的サイトビルダーです。

Eleventyは、いくつかの [古いHTMLテンプレート言語](https://www.11ty.dev/docs/languages/) を使用してWebサイトをレンダリングします。サポートしているテンプレート言語には、Nunjucks、Liquid、Pug、EJSなどがあります。Astroでは、お気に入りのUIコンポーネントライブラリ（React、Preact、Vue、Svelteなど）や、HTML + JSXに似た、組み込みのコンポーネント構文を使ってページを作成できます。 Eleventyは、モダンなUIコンポーネントを使ったHTMLのテンプレート化には対応していません。

### EleventyとAstroのパフォーマンス比較

Eleventyのコンセプトは、Astroの「クライアントサイドのJavaScriptを最小限にする」というWeb開発のアプローチと一致しています。EleventyとAstroは、どちらも同様に、デフォルトではJavaScriptを使用しないパフォーマンスを基本として提供します。

Eleventyは、JavaScriptを完全に避けることでこれを実現しています。Eleventyのサイトは、往々にしてJavaScriptをほとんど、あるいはまったく使わずに書かれています。これは、クライアントサイドのJavaScriptが必要になったときに問題になります。Eleventyのために独自のアセットビルドパイプラインを作成することは、あなた次第です。そのため、バンドルやミニファイなどの複雑な最適化を自分で設定しなければならず、時間がかかります。

これに対して、Astroは、クライアントサイドのJavaScriptとCSSを自動的に構築します。Astroでは、ページ内の不要なJavaScriptを自動的に外し、必要な個々のコンポーネントのみをハイドレーションします。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。この機能は、Eleventyでも自分で用意すれば実現可能ですが、Astroでは、デフォルトで組み込まれています。

## Gatsby vs. Astro

[Gatsby](https://www.gatsbyjs.com/)は、React向けの人気のWebサイト＆アプリケーションフレームワークです。

GatsbyはReactを使ってWebサイトをレンダリングします。Astroはより柔軟で、人気のあるコンポーネントライブラリ（React、Preact、Vue、Svelte、Solidなど）や、HTML+JSXに似たAstroのHTMLライクなコンポーネント構文を使ってUIを自由に構築できます。

Gatsby v4は、インクリメンタル・リビルドによる静的サイト生成 (SSG)、Deferred Static Generation (DSG)、サーバーサイドレンダリング (SSR)のすべてをサポートしています。現在、Astroは静的サイト生成（SSG）のみをサポートしています。

Gatsbyでは、サイトのすべてのコンテンツを扱うために、カスタムのGraphQL APIが必要です。開発者の中にはこのモデルを好む人もいますが、Gatsbyに対する一般的な批判は、このモデルが複雑になりすぎて、とくにサイトの成長に伴って維持するのが難しくなるというものです。Astroでは、GraphQLを必要とせず、代わりに（`fetch()`やトップレベル`await`のような）使い慣れたAPIを提供し、データが必要とされる場所の近くでデータを読み込めます。

### GastbyとAstroのパフォーマンス比較

ほとんどの場合、AstroのWebサイトは、GatsbyのWebサイトよりも大幅に速く読み込まれます。これは、Astroがページから不要なJavaScriptを自動的に外し、必要な個々のコンポーネントのみをハイドレーションするためです。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。

Gatsbyはパーシャルハイドレーションをサポートしておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションするようになっています。これにより、ページの読み込みが遅くなり、Webサイトのパフォーマンスが低下します。Gatsbyには、ページからすべてのJavaScriptを削除するための[コミュニティプラグイン](https://www.gatsbyjs.com/plugins/gatsby-plugin-no-javascript/)がありますが、これでは多くのWebサイトが壊れてしまいます。このプラグインを使うなら、各ページのインタラクティブ性について、「すべてか無か」の決断を迫られることになります。

Gatsbyには素晴らしいプラグインエコシステムがあり、ニーズに応じてGatsbyをより良い選択にすることができます。[gatsby-plugin-image](https://www.gatsbyjs.com/plugins/gatsby-plugin-image/)は、画像の最適化のための人気のあるプラグインで、画像を多用するWebサイトにはGatsbyが適しているかもしれません。

### ケーススタディ：ドキュメントサイトの構築

[gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/) は、Gatsbyで構築されたGatsbyの公式ドキュメントサイトです。このWebサイトは、Astroの公式ドキュメントWebサイトと比較して、十分に似たデザインと機能セットを提供しています。これにより、この一般的なユースケースにおける、2つのサイトビルダーの**大雑把に実際のサイト**での比較が可能になりました。

- **Gatsbyパフォーマンススコア**: 100点満点中64点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fwww.gatsbyjs.com%2Fdocs%2Fquick-start%2F)
- **Astroパフォーマンススコア**: 100点満点中99点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このパフォーマンス差の大きな理由の1つは、AstroのJavaScriptペイロードの小ささです。[gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/)では、最初のページ読み込み時に**417kb**のJavaScriptをロードするのに対し、[docs.astro.build](https://docs.astro.build)では、最初の読み込み後に**78.7kb**（全体で81%のJavaScript削減）のJavaScriptをロードします。

## Hugo vs. Astro

[Hugo](https://gohugo.io/) は、人気のある静的サイトジェネレーターで、Goで書かれています。

Hugoは独自の[テンプレート言語](https://gohugo.io/templates/introduction/)を使ってWebサイトを作成します。Astroでは、お気に入りのUIコンポーネントライブラリ（React、Preact、Vue、Svelteなど）や、HTML+JSXに似た組み込みのコンポーネント構文を使ってページを作成できます。Hugoは、モダンなUIコンポーネントを使ったHTMLのテンプレート化をサポートしていません。

### HugoとAstroのパフォーマンスの比較

Hugoのコンセプトは、Astroの「クライアントサイドのJavaScriptを最小限にする」というWeb開発のアプローチと一致しています。HugoとAstroは、どちらも同様に、デフォルトでJavaScriptを使用しないパフォーマンスを基本として提供します。

HugoもAstroも、JavaScriptのビルド、バンドル、ミニファイをサポートします。Astroは、ページから不要なJavaScriptを自動的に外し、必要な個々のコンポーネントのみをハイドレーションします。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。Hugoでもこの機能を実現できますが、Astroではデフォルトでこの機能が組み込まれています。

## Jekyll vs. Astro

[Jekyll](https://jekyllrb.com/) は、人気の高い静的サイトジェネレーターで、Rubyで書かれています。

Jekyllは、[Liquidと呼ばれる古いテンプレート言語](https://jekyllrb.com/docs/liquid/)を使ってWebサイトをレンダリングします。Astroは、お気に入りのUIコンポーネントライブラリ（React、Preact、Vue、Svelteなど）や、HTML + JSXに似た組み込みのコンポーネント構文を使ってページを作成できます。Jekyllは、モダンなUIコンポーネントを使ったHTMLのテンプレート化をサポートしていません。

### JekyllとAstroのパフォーマンス比較

Jekyllのコンセプトは、Astroの「クライアントサイドのJavaScriptを最小限にする」というWeb開発アプローチと一致しています。JekyllとAstroは、どちらも同じように、デフォルトでJavaScriptを使用しないパフォーマンスを基本として提供します。

Jekyllは、JavaScriptを完全に避けることでこれを実現しています。Jekyllのサイトは、往々にしてJavaScriptをほとんど、あるいはまったく使わずに書かれていて、代わりにサーバーサイドでのHTML生成を推進しています。これは、クライアントサイドのJavaScriptが必要になったとき、問題になります。Jekyllのために独自のビルドパイプラインを作成するのはあなた次第です。そのため、バンドルやミニファイなどの最適化を自分で設定しなければならず、手間がかかります。

これに対して、Astroは、クライアントサイドのJavaScriptを自動的に構築します。Astroでは、必要最低限のJavaScriptのみを、最小化、バンドル、最適化してブラウザに送信します。これは、Jekyllでも実現可能ですが、Astroではデフォルトで組み込まれています。

## SvelteKit vs. Astro

[SvelteKit](https://kit.svelte.dev/) は、Svelte用のWebサイト＆アプリケーションフレームワークとして人気があります。

SvelteKitは、Svelteを使ってWebサイトを生成します。Astroはより柔軟で、人気のあるコンポーネントライブラリ（React、Preact、Vue、Svelte、Solidなど）や、HTML+JSXに似たAstroのHTMLライクなコンポーネント構文を使ってUIを自由に構築できます。

SvelteKitもAstroも、Webサイトを構築するためのフレームワークです。SvelteKitは動的なWebサイト（ダッシュボードや受信トレイなど）に適しており、Astroは静的なWebサイト（コンテンツやeコマースサイトなど）に適しています。

SvelteKitは、静的サイト生成（SSG）とサーバーサイドレンダリング（SSR）の両方をサポートしています。現在、Astroは静的サイト生成（SSG）のみをサポートしています。

### SvelteKitとAstroのパフォーマンス比較

ほとんどの場合、AstroのWebサイトはSvelteKitのWebサイトよりも速く読み込まれます。これは、Astroがページから不要なJavaScriptを自動的に取り除き、必要な個々のコンポーネントのみをハイドレーションするためです。この機能は、[パーシャルハイドレーション](/core-concepts/component-hydration)と呼ばれています。

SvelteKitはパーシャルハイドレーションに対応しておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションするようになっています。これにより、ページの読み込みが遅くなり、Webサイトのパフォーマンスが低下します。SvelteKitは、[ページレベルの静的なゼロJavaScriptページ](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate)をサポートしています。しかし、ページ上の個々のコンポーネントをハイドレートするためのサポートは予定されていません。このため、各ページのインタラクティブ性については、「すべてか無か」の判断を迫られることになります。

### ケーススタディ：ドキュメントサイトの構築

[kit.svelte.dev](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate) は、SvelteKitで構築されたSvelteKitの公式ドキュメントサイトです。このWebサイトは、Astroの公式ドキュメントWebサイトと比較して、十分に似たデザインと機能を提供しています。これにより、この一般的なユースケースにおける2つのサイトビルダーの**大雑把に実際のサイト**での比較ができます。

今回テストした2つのサイトの注目すべき違いが1つあります。SvelteKitのドキュメントは1つのページとして提供されるのに対し、Astroのドキュメントは複数のページに分かれています。この大きなコンテンツペイロードは、ツール自体とは関係なく、パフォーマンスに若干のマイナス影響を与えるはずです。

- **SvelteKit パフォーマンススコア**: 100点満点中92点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fkit.svelte.dev%2Fdocs)
- **Astro パフォーマンススコア**: 100点満点中99点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このテストでは、SvelteKitはAstroと同等のパフォーマンスを発揮しました。

## Next.js vs. Astro

[Next.js](https://nextjs.org/) は、React用のWebサイト＆アプリケーションフレームワークとして人気があります。

Next.jsはReactを使ってWebサイトをレンダリングします。Astroはより柔軟で、人気のあるコンポーネントライブラリ（React、Preact、Vue、Svelte、Solidなど）や、HTML+JSXに似たAstroのHTMLライクなコンポーネント構文を使ってUIを自由に構築できます。

Next.jsもAstroも、Webサイトを構築するためのフレームワークです。Next.jsはダッシュボードや受信トレイなどの動的なWebサイトに適しており、Astroはコンテンツやeコマースサイトなどの静的なWebサイトに適しています。

Next.jsは静的サイト生成（SSG）とサーバーサイドレンダリング（SSR）の両方をサポートしています。現在、Astroは静的サイト生成（SSG）のみをサポートしています。

### Next.jsとAstroのパフォーマンス比較

ほとんどの場合、AstroのWebサイトはNext.jsのWebサイトよりも圧倒的に速く読み込まれます。これは、Astroがページから不要なJavaScriptを自動的に取り除き、必要な個々のコンポーネントのみをハイドレーションするためです。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。

Next.jsはパーシャルハイドレーションをサポートしておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションするようになっています。そのため、ページの読み込みが遅くなり、Webサイトのパフォーマンスが低下します。Next.jsは、完全にスタティックな、JavaScriptを使用しないページを[実験的にサポート](https://piccalil.li/blog/new-year-new-website/#heading-no-client-side-react-code) しています。しかし、ページ上の個々のコンポーネントをハイドレートするためのサポートは予定されていません。そのため、各ページのインタラクティブ性については、「すべてか無か」の判断を迫られることになります。

Next.jsには画像を最適化する機能が組み込まれているため、画像を多用するWebサイトではNext.jsの方が適しているかもしれません。

### ケーススタディ：ドキュメントサイトの構築

[nextjs.org/docs](https://nextjs.org/docs/getting-started) は、Next.jsで構築された公式のNext.jsドキュメントサイトです。このWebサイトは、Astroの公式ドキュメントサイトと比較しても、十分に似たデザインと機能を備えています。これにより、この一般的なユースケースにおける2つのサイトビルダーの**大雑把に実際のサイト**での比較ができます。

- **Next.js パフォーマンススコア**: 100点満点中59点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnextjs.org%2Fdocs%2Fgetting-started)
- **Astro パフォーマンススコア**: 100点満点中99点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このパフォーマンス差の大きな理由の1つは、AstroのJavaScriptペイロードの小ささです。
[nextjs.org/docs](https://nextjs.org/docs/getting-started)が最初のページ読み込み時に**463kb**のJavaScriptをロードするのに対し、 [docs.astro.build](https://docs.astro.build)は最初の読み込み後に**78.7kb**（全体では83％のJavaScript削減）のJavaScriptをロードします。

## Nuxt vs. Astro

[Nuxt](https://nuxtjs.org/) は、人気のあるVueのWebサイト＆アプリケーションフレームワークです。Next.jsに似ています。

NuxtはVueを使ってWebサイトを生成します。Astroはより柔軟で、人気のあるコンポーネントライブラリ（React、Preact、Vue、Svelte、Solidなど）や、HTML+JSXに似たAstroのHTMLライクなコンポーネント構文を使ってUIを自由に構築できます。

NuxtもAstroも、Webサイトを構築するためのフレームワークです。Nuxtは動的なWebサイト（ダッシュボードや受信トレイなど）に最適で、Astroは静的なWebサイト（コンテンツやeコマースサイトなど）に最適です。

Nuxt は静的サイト生成（SSG）とサーバーサイドレンダリング（SSR）の両方をサポートしています。現在、Astroは静的サイト生成（SSG）のみをサポートしています。

### NuxtとAstroのパフォーマンス比較

ほとんどの場合、AstroのWebサイトはNuxtのWebサイトよりも圧倒的に速く読み込まれます。これは、Astroがページから不要なJavaScriptを自動的に取り除き、必要な個々のコンポーネントのみをハイドレーションするためです。この機能は、[パーシャルハイドレーション](/core-concepts/component-hydration)と呼ばれています。

Nuxtはパーシャルハイドレーションに対応しておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションします。これにより、ページの読み込みが遅くなり、Webサイトのパフォーマンスが低下します。この動作を無効にする方法は、Nuxtにはありません。

Nuxtには優れた画像最適化機能が内蔵されているため、画像を多用するWebサイトではNuxtの方が適している場合があります。

### ケーススタディ：ドキュメントサイトの構築

[nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) は、Nuxtで構築されたNuxtの公式ドキュメントサイトです。このWebサイトは、Astroの公式ドキュメントサイトと比較しても、十分に似たデザインと機能を備えています。これにより、2つのサイトビルダーを、この一般的なユースケースにおいて、**大雑把に実際のサイト**で比較できます。

- **Nuxt パフォーマンススコア**: 100点満点中48点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnuxtjs.org%2Fdocs%2F2.x%2Fget-started%2Finstallation)
- **Astro パフォーマンススコア**: 100点満点中99点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このパフォーマンスの差の大きな理由の1つは、AstroのJavaScriptペイロードの小ささです。
 [nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation)が最初のページ読み込み時に **469kb** のJavaScriptをロードするのに対し、 [docs.astro.build](https://docs.astro.build) は最初の読み込み後に **78.7kb**（83%減）のJavaScriptをロードします。

## VuePress vs. Astro

[VuePress](https://vuepress.vuejs.org/guide/) は、Vue.jsの作者が開発した、人気の高いドキュメントWebサイト生成ツールです。VuePressはVue.jsを使用してWebサイトのUIを生成し、AstroはReact、Vue.js、Svelte、生のHTMLテンプレートをサポートしています。

VuePressは、ドキュメントサイト用に設計されており、Astroではサポートしていないドキュメントに特化したWebサイトの機能がいくつか組み込まれています。その代わり、Astroでは、ドキュメントに特化した機能を公式の [`docs`](https://github.com/snowpackjs/astro/tree/main/examples/docs)テーマで提供しており、サイトに使用できます。このWebサイトは、そのテンプレートを使って作られています。

Vue.jsの作者であるEvan You氏は現在、[VitePress](https://vitepress.vuejs.org/)というVuePressの新バージョンを開発しています。VuePressに代わるモダンなツールをお求めの方は、なぜ、VitePressがより良い選択肢なのか、[Evan氏の投稿](https://github.com/snowpackjs/astro/issues/1159#issue-974035962)をご覧ください。

### VuePressとAstroのパフォーマンス比較

ほとんどの場合、AstroのWebサイトはVuePressのWebサイトよりも圧倒的に速く読み込まれます。これは、Astroがページから不要なJavaScriptを自動的に外し、必要な個々のコンポーネントのみをハイドレーションするためです。この機能は、[パーシャルハイドレーション](/core-concepts/component-hydration)と呼ばれています。

VuePressはパーシャルハイドレーションに対応しておらず、ページコンテンツのほとんどが静的なものであっても、ユーザーがブラウザでページ全体を読み込んで再ハイドレーションするようになっています。これにより、ページの読み込みが遅くなり、Webサイトのパフォーマンスが低下します。VuePressでは、この動作を無効にする方法はありません。

### ケーススタディ：ドキュメントサイトの構築

[vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) は、VuePressで構築された、VuePressの公式ドキュメントサイトです。このサイトは、Astroの公式ドキュメントサイトと比較しても、十分に似たデザインと機能セットを提供しています。これにより、2つのサイトビルダーを、この一般的なユースケースにおいて、**大雑把に実際のサイト**で比較できます。


- **Vuepress パフォーマンススコア**: 100点満点中63点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fvuepress.vuejs.org%2Fguide%2F)
- **Astro パフォーマンススコア**: 100点満点中99点 [（テスト結果）](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

このパフォーマンス差の大きな理由の1つは、AstroのJavaScriptペイロードの小ささです。[vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) が最初のページ読み込みで **166kb** のJavaScriptをロードするのに対し、 [docs.astro.build](https://docs.astro.build)は最初の読み込み後に **78.7kb**（全体で53％のJavaScript削減）のJavaScriptをロードします。

## Zola vs. Astro

Zolaは、Rustを使った人気の高い高速な静的サイトジェネレーターです。

Zolaは [Tera](https://tera.netlify.app/) を使ってWebサイトを生成します。Astroは、お気に入りのUIコンポーネントライブラリ（React、Preact、Vue、Svelteなど）や、HTML + JSXに似た組み込みのコンポーネント構文を使ってページを作成できます。ZolaはモダンなUIコンポーネントを使ったHTMLのテンプレート化には対応していません。

### ZolaとAstroのパフォーマンス比較

コンセプト的には、ZolaはAstroの「クライアントサイドのJavaScriptを最小限にする」というWeb開発のアプローチと一致しています。ZolaとAstroは、どちらも似たような、デフォルトではJavaScriptを使用しないパフォーマンスを基本として提供します。

Astroは、JavaScriptのビルド、バンドル、ミニファイをサポートしています。Zolaでは、JavaScriptをバンドルして処理するために、webpackのような別のビルドツールを使用する必要があります。Astroでは、ページから不要なJavaScriptを自動的に外し、必要な個々のコンポーネントのみをハイドレーションします。この機能を[パーシャルハイドレーション](/core-concepts/component-hydration)と呼びます。Zolaでもこの機能を実現することは可能ですが、Astroではデフォルトでこの機能が組み込まれています。
