---
layout: ~/layouts/MainLayout.astro
title: 快速開始
---

```shell
# 環境需求：檢查 Node.js 版本是 12.20.0+、14.13.1+ 或 16+。
node --version

# 開新專案資料夾，並且直接移動到該處
mkdir my-astro-project && cd $_

# 準備發射...
npm init astro

# 安裝相依套件
npm install

# 開始開發！
npm start

# 做好之後：把靜態網站 build 進 `dist/`
npm run build
```

若想要知道還有哪些方法能夠以 Astro 來做專案，請[閱讀安裝指南](installation)。

## 開始專案

專案目錄裡，在終端機輸入以下指令：

```bash
npm start
```

現在，Astro 就會開啟應用程式的伺服器，位置是 [http://localhost:3000](http://localhost:3000)。在瀏覽器打開這網址，就會看到 Astro 的 「Hello, World」。

伺服器會即時監聽 `src/` 資料夾的檔案異動，所以在開發過程的更新毋需重新啟動應用程式。

## Build 專案

若要將專案 Build 起來，移至資料夾裡面，在終端機輸入指令：

```bash
npm run build
```

這樣就會指揮 Astro 開始 Build 網站，存在磁碟裡。現在，應用程式已經放在 `dist/` 資料夾裡準備好了。

## 部署專案

Astro 網站是靜態的，所以可以發布至慣用的主機：

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [S3 bucket](https://aws.amazon.com/s3/)
- [Google Firebase](https://firebase.google.com/)
- [「部署指南」有更多部署 Astro 的細節。](/guides/deploy)

## 下一步

成功了！現在即可開始開發！

我們建議花點時間更熟悉 Astro 的運作方式。只要在文件裡進一步探索，建議看看這些：

📚 深入了解 Astro 的專案架構：[專案架構指南。](/core-concepts/project-structure)

📚 深入了解 Astro 的元件語法：[Astro 元件指南。](/core-concepts/astro-components)

📚 深入了解 Astro 根據檔案產生的路徑：[路徑指南。](core-concepts/astro-pages)
