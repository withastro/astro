---
layout: ~/layouts/MainLayout.astro
title: 安裝
lang: zh-Hant-TW
---

有幾種方式把 Astro 安裝在新專案。

## 環境需求

- **Node.js** - `v14.15.0` 和 `v16.0.0`，或更之後的版本。
- **文字編輯器** - 我們推薦使用 [VS Code](https://code.visualstudio.com/) 和 [Astro 官方擴充套件](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode)。
- **終端機** - Astro 主要透過終端機指令進行。

下方範例使用的 [`npm`](https://www.npmjs.com/) 只是用來舉例。也可以使用 [`yarn`](https://yarnpkg.com/) 或 [`pnpm`](https://pnpm.io/) 等 npm 替代方案。

## 建立 Astro

`npm init astro` 是新專案裡，最容易安裝 Astro 的方式。在終端機裡執行這個指令，就可以啟動 `create-astro` 安裝精靈，協助設定新專案。

```shell
# 用 NPM
npm init astro

# Yarn
yarn create astro
```

[`create-astro`](https://github.com/withastro/astro/tree/main/packages/create-astro) 精靈提供一些[上手範本](/examples)進行挑選。或者，也可以直接從 Github 匯入自己的 Astro 專案。

```bash
# 提醒：把「my-astro-project」改為專案的名稱。

# npm 6.x
npm init astro my-astro-project --template starter
# npm 7+（一定要多加上一組雙橫槓）
npm init astro my-astro-project -- --template starter
# yarn
yarn create astro my-astro-project --template starter
# 使用第三方範本
npm init astro my-astro-project -- --template [GITHUB_USER]/[REPO_NAME]
# 在 Repo 裡，使用第三方範本
npm init astro my-astro-project -- --template [GITHUB_USER]/[REPO_NAME]/path/to/template
```

`create-astro` 架設好專案的基礎外框之後，記得要用 npm 或偏好的套件管理工具，安裝專案的相依套件。範例裡使用 npm：

```bash
npm install
```

現在，可以[啟動](#start-astro) Astro 專案。把 Astro 專案組裝好之後，接著是 [Build](#build-astro) 專案。Astro 就會將應用程式打包起來，準備好靜態檔案，就可以[部署](/guides/deploy)至慣用的主機服務。

## 手動安裝

沒有 `create-astro` 精靈的協助，也可以設定 Astro。接下來就是要讓 Astro 動起來的一些額外步驟。

### 設定專案

```bash
# 建立、進入新資料夾
mkdir my-astro-project
cd my-astro-project
```

建立以專案名稱為名的空資料夾，接著進入該處：

### 建立 `package.json`

```bash
# 這個指令會建立基本的 package.json
npm init --yes
```

Astro 設計成與 npm 套件整體生態一起運作，由專案根目錄  裡，稱為 `package.json` 的專案 Manifest 進行管理。如果不熟悉 `package.json` 檔案，強烈建議先將 [npm 文件](https://docs.npmjs.com/creating-a-package-json-file)快速讀過一遍。

### 安裝 Astro

按照上方的指示之後，應該有個資料夾，裡面只有 `package.json` 一個檔案。現在即可在專案裡設定 Astro。

```bash
npm install astro
```

取代 `package.json` 檔案裡，從 `npm init` 產生、一開始就有的 "script" 部分：

```diff
  "scripts": {
-    "test": "echo \"Error: no test specified\" && exit 1"
+    "dev": "astro dev",
+    "build": "astro build",
+    "preview": "astro preview"
  },
}
```

[`dev`](#start-astro) 指令在 `http://localhost:3000` 啟動 Astro 開發伺服器。一但專案已經準備好，[`build`](#build-astro) 指令將專案輸出至 `dist/` 資料夾。[在「部署指南」深入閱讀部署 Astro](/guides/deploy)。

### 建立第一個頁面

打開偏好的文字編輯器，接著在專案裡新增檔案：

1. 在 `src/pages/index.astro` 新增檔案
2. 在檔案裡複製貼上以下程式碼片段（包含橫槓 `---` ）：

```astro
---
// 在程式碼 fence 之間寫的 JS/TS 程式碼，
// 只會在伺服器端執行！
console.log('See me in the Terminal')
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
 // 在這裡輸入的 JS 程式碼只會在瀏覽器執行
 console.log('See me in the devTools')
</script>
```

以上就是 Astro 的元件語法範例，同時包含 HTML 和 JSX。

在 `src/pages` 資料夾裡還可以加入更多頁面，Astro 就會使用檔案名稱建立網站的新頁面。舉例來說，位在 `src/pages/about.astro` 的檔案（可以重複使用上面的程式碼片段），Astro 就會有網址是 `http://localhost/about` 的新頁面。

## [啟動 Astro](#start-astro)

```bash
npm run dev
```

Astro 會為應用程式打開 `http://localhost:3000` 的伺服器。在瀏覽器開啟網址，就會看到 Astro 的「Hello World」。

## [Build Astro](#build-astro)

```bash
npm run build
```

這樣就會指揮 Astro 開始 Build 網站，存在磁碟裡。現在，應用程式已經放在 `dist/` 資料夾裡準備好了。

### 下一步

成功了！現在即可開始開發！

我們建議花點時間更熟悉 Astro 的運作方式。只要在文件裡進一步探索，建議看看這些：

📚 深入了解 Astro 的專案架構：[專案架構指南。](/core-concepts/project-structure)

📚 深入了解 Astro 的元件語法：[Astro 元件指南。](/core-concepts/astro-components)

📚 深入了解 Astro 根據檔案產生的路徑：[路徑指南。](core-concepts/astro-pages)
