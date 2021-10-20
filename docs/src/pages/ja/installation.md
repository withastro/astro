---
layout: ~/layouts/MainLayout.astro
title: インストール
description: npm、pnpm、YarnでのAstroのインストール方法
lang: ja
---

新しいプロジェクトにAstroをインストールするには、いくつかの方法があります。

## 事前準備

- **Node.js** - `v12.20.0`、`v14.13.1`、`v16.0.0`、またはそれ以上。
- **テキストエディター** - [VS Code](https://code.visualstudio.com/) と [公式Astro extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode)をオススメします。
- **ターミナル** - Astroは主にターミナルのコマンドラインからアクセスします。

解説のため、このドキュメントでは [`npm`](https://www.npmjs.com/) を使用しますが、npmの代わりに [`Yarn`](https://yarnpkg.com/) や [`pnpm`](https://pnpm.io/) を使用してもかまいません。

## ウィザードによる作成

新しいプロジェクトにAstroをインストールするには、`npm init astro`がもっとも簡単な方法です。ターミナルでこのコマンドを実行すると、新しいプロジェクトのセットアップを支援する`create-astro`インストールウィザードが起動します。

```shell
# npm
npm init astro

# Yarn
yarn create astro

# pnpm
pnpm create astro
```

[`create-astro`](https://github.com/snowpackjs/astro/tree/main/packages/create-astro)ウィザードでは、[スターターテンプレート](https://github.com/snowpackjs/astro/tree/main/examples)から好きなものを選べます。代わりにGitHubから自分のAstroプロジェクトを直接インポートもできます。

```bash
# 注: "my-astro-project" はあなたのプロジェクト名に置き換えてください。

# npm 6.x
npm init astro my-astro-project --template starter
# npm 7+ (追加でダブルダッシュが必要)
npm init astro my-astro-project -- --template starter
# Yarn
yarn create astro my-astro-project --template starter
# pnpm
pnpm create astro my-astro-project --template starter
# サードパーティのテンプレートを使用
npm init astro my-astro-project -- --template [GITHUB_USER]/[REPO_NAME]
# パスを指定してサードパーティのテンプレートを使用
npm init astro my-astro-project -- --template [GITHUB_USER]/[REPO_NAME]/path/to/template
```

`create-astro` でプロジェクトを作成したら、npmやお好みのパッケージマネージャーを使って、プロジェクトの依存関係をインストールすることを忘れないでください。この例では、npmを使用します。

```bash
npm install
```

これで、Astroプロジェクトを[スタート](#astroの開始)できます。Astroの実行に必要なファイルの準備ができたら、プロジェクトを[ビルド](#astroのビルド)できます。 Astroはアプリケーションをパッケージ化し、静的ファイルを用意しますので、好きなホスティングサービスに[デプロイ](/guides/deploy)できます。

## 手動インストール

Astroは、`create-astro`ウィザードを使わなくてもインストールできます。以下に、Astroを動作させるために必要な追加手順を示します。

### プロジェクトのセットアップ

```bash
# 新しいディレクトリを作成し、その中に移動してください。
mkdir my-astro-project
cd my-astro-project
```

プロジェクト名で空のディレクトリを作成し、その中に移動します。

### `package.json` の作成

```bash
# This command will create a basic package.json for you
npm init --yes
```

Astroは、npmパッケージ・エコシステム全体を扱うように設計されています。
これは、プロジェクトのルートにある「package.json」と呼ばれるプロジェクト・マニフェストで管理されます。もし、`package.json`ファイルに慣れていないのであれば、[npmのドキュメント](https://docs.npmjs.com/creating-a-package-json-file)を参照することを強くオススメします。


### Astroのインストール

上記の手順で、「package.json」ファイルのあるディレクトリが完成しました。これで、プロジェクト内にAstroをインストールできます。

```bash
npm install astro
```

次に、`npm init`が作成してくれた`package.json`ファイルの"scripts"セクションを、以下のように置き換えます。

```diff
  "scripts": {
-    "test": "echo \"Error: no test specified\" && exit 1"
+    "dev": "astro dev",
+    "build": "astro build",
+    "preview": "astro preview"
  },
}
```

 [`dev`](#astroの開始)コマンドは、Astro Dev Server（`http://localhost:3000`）を起動します。プロジェクトの準備ができたら、[`build`](#astroのビルド)コマンドで、プロジェクトを`dist/`ディレクトリに出力します。Astroのデプロイについては、[デプロイガイド](/guides/deploy)をご覧ください。

### 最初のページを作る

お気に入りのテキストエディターを開き、プロジェクト内に新規ファイルを作成します。

1. `src/pages/index.astro` に新しいファイルを作成する
2. 以下のスニペットをコピー＆ペーストする（`---`のダッシュも含みます）

```astro
---
// (---)のコードフェンスの間には、JS/TSコードが書かれています。
// これらのコードはサーバー上でのみ実行されます！
console.log('これはターミナルに表示されます')
---

<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>

<style lang='css||scss'>
  body{
    h1{
      color:orange;
    }
  }
</style>

<script>
 // ここに書かれたJSコードは、すべてブラウザ上で実行されます。
 console.log('これはデベロッパーツールに表示されます')
</script>
```

上記は、Astroコンポーネント構文の一例で、HTMLとJSXの両方で構成されています。

`src/pages`ディレクトリには、さらに多くのページを作成でき、Astroはそのファイル名を使ってサイトに新しいページを作成します。たとえば、`src/pages/about.astro`に（前のスニペットを再利用して）新しいファイルを作成すると、`http://localhost/about`というURLに新しいページが作成されます。

## [Astroの開始](#astroの開始)

```bash
npm run dev
```

これでAstroは、`http://localhost:3000`でアプリケーションのサービスを開始します。このURLをブラウザで開くと、Astroの「Hello, World」が表示されるはずです。

開発の進捗状況をローカルネットワーク上で共有したり、スマートフォンからアプリを確認したければ、以下の[snowpack](https://www.snowpack.dev/reference/configuration#devoptionshostname)オプションを`astro.config.mjs`に追加してください。

```js
devOptions: {
  hostname: '0.0.0.0';
}
```

## [Astroのビルド](#astroのビルド)

```bash
npm run build
```

このコマンドを実行すると、Astroはサイトを構築し、ディスクに直接保存するように指示します。
`dist/`ディレクトリをみると構築されたアプリケーションが確認できます。


## 次のステップ

これで開発を始める準備が整いました。

Astroがどのように機能しているかをもっとよく知ることを強くオススメします。そのためには、これらのドキュメントを探索することを検討してみてください。


📚 Astroのプロジェクト構造については、[プロジェクト構造ガイド](/core-concepts/project-structure)をご覧ください。

📚 Astroのコンポーネント構文については[Astroコンポーネントガイド](/core-concepts/astro-components)を参照してください。

📚 Astroのファイルベースのルーティングについては、[ルーティングガイド](core-concepts/astro-pages)を参照してください。
