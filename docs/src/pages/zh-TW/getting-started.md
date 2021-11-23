---
layout: ~/layouts/MainLayout.astro
title: 新手上路
lang: zh-Hant-TW
---

Astro 是利用現代技術的靜態網站生成工具。可以從[首頁](https://astro.build/)或[釋出版本貼文](https://astro.build/blog/introducing-astro)來了解 Astro 的用途。此頁面是 Astro 文件與所有相關資源的概要。

## 試玩 Astro

試用 Astro 最簡單的方法，就是在機器的新資料夾裡執行 `npm init astro`。我們製作的 CLI 精靈會協助開啟全新的 Astro 專案。

簡易又迅速 5 步驟就開始使用 Astro 的方法，請看 [快速開始指南](quick-start)。

或者，閱讀[安裝指南](/installation)，有安裝 Astro 的完整流程。

### 示範專案

比較喜歡從範例來學 Astro 的話，請看放在 Github 的[範例資源庫](https://github.com/withastro/astro/tree/main/examples)。

這裡的範例都可以在本地端機器執行 `npm init astro` 並加上 CLI Flag: `--template`。
`--template` Flag 也支援第三方、社群的範本。

```bash
# 執行 init 精靈，並使用官方範本
npm init astro -- --template [OFFICIAL_EXAMPLE_NAME]
# 執行 init 精靈，並使用社群範本
npm init astro -- --template [GITHUB_USER]/[REPO_NAME]
npm init astro -- --template [GITHUB_USER]/[REPO_NAME]/path/to/example
```

### 線上玩玩看

有興趣在瀏覽器試玩 Astro 的話，可以在 Stackblitz、CodeSandbox、Gitpod 或 GitHub Codespaces 使用線上程式碼編輯器。點選[範例資源庫](https://github.com/withastro/astro/tree/main/examples)裡任一個範例的 "Open in Stackblitz" 連結。或者，[點此](https://stackblitz.com/fork/astro)在 Stackblitz 開啟新專案。

## 學習 Astro

每個來到 Astro 的人來自不同背景，使得學習方式也不同。不管是喜歡更為理論，還是實際的方法，希望都可以覺得這部分很有用。

- 如果喜歡**從做中學**，從[範例資源庫](https://github.com/withastro/astro/tree/main/examples)開始。
- 如果喜歡**一步一步學習概念**，就從[基本概念與指南](/core-concepts/project-structure)開始。

就像任何還不熟悉的技術，Astro 會有一些學習曲線。只不過，只要練習和一些耐心，我們確信很快就會熟悉。

### 學習 `.astro` 語法

開始學習 Astro 的時候，會看到很多檔案副檔名是 `.astro`。這是 **Astro 的元件語法**：近似於 HTML 的特殊檔案格式，Astro 用來當作範本。設計成有 HTML 或 JSX 經驗的人都覺得和藹可親。

[Astro 元件](/core-concepts/astro-components)指南會很有幫助，介紹 Astro 的語法，也是最好的學習方式。

### API 參考手冊

如果想要深入探討某個 Astro API，這部分的文件會很有幫助。例如：[設定參考](/reference/configuration-reference)列出所有可以使用的設定選項。[內建元件參考](/reference/builtin-components)列出所有可以使用的核心元件，像是 `<Markdown />` 和 `<Code />`。

### 先前版本的文件

這份文件就肯定是根據 Astro 最新的穩定版本。一但達到 1.0 里程碑，會增加查閱過去文件版本的功能。

## 獲得最新訊息

推特帳號 [@astrodotbuild](https://twitter.com/astrodotbuild) 是 Astro 團隊撰寫的官方更新消息來源。

我們也會把釋出版本公告貼在 [Discord 社群](https://astro.build/chat) 的 #announcements 頻道。

不是每個 Astro 釋出版本都會有一篇專屬的部落格貼文。然而，還是可以在 [Astro 的 Repository 裡的 `CHANGELOG.md` 檔案](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md)，找到每個釋出版本的詳細變動記錄。

## 還漏了什麼嗎？

如果文件裡有東西沒寫到，或是覺得有些地方很難理解，請[開文件的 Issue](https://github.com/withastro/astro/issues/new/choose)，附上改進建議，或推文到推特帳號 [@astrodotbuild](https://twitter.com/astrodotbuild)。我們喜愛聽到回饋！

## 參考

這份新手上路指南一開始是根據 [React](https://reactjs.org/) 的新手上路指南。
