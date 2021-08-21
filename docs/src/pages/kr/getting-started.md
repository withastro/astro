---
layout: ~/layouts/MainLayout.astro
title: 시작하기
lang: kr
---

Astro는 현대적인 정적 사이트 생성기(Static Site Generator)입니다. [홈페이지](https://astro.build/)나 [블로그](https://astro.build/blog/introducing-astro) 글을 통해 Astro에 대한 모든 것을 알아보세요. 이 페이지는 Astro 문서와 관련된 리소스를 소개합니다. 

Astro가 궁금하다면 [홈페이지](https://astro.build)에서 간단한 소개글을 읽어보세요.

## Astro 시작하기

Astro를 시작하는 가장 쉬운 방법은 `npm init astro` 명령어를 실행하는 것입니다. 새로운 디렉토리에서 명령어를 실행해주세요. CLI 도우미가 새로운 프로젝트를 시작할 수 있도록 도와줍니다. 

이 문서의 퀵스타트 가이드에서는 Astro를 쉽고 빠르게 시작할 수 있도록 도와주는 5가지 단계를 소개하고 있습니다. [퀵스타트 가이드](quick-start) 페이지를 방문해 관련 내용을 자세히 알아보세요.

혹은 [설치 가이드](/installation)를 통해 Astro 시작과 설정에 관한 자세한 설명을 읽어볼 수도 있습니다.

### 온라인 플레이그라운드

온라인 플레이그라운드를 통해 Astro를 브라우저 환경에서 체험해보는 것도 가능합니다. [CodeSandbox](https://codesandbox.io/s/astro-template-hugb3)에서 "Hello World!" 템플릿으로 시작해보세요. 

_주의: 몇몇 기능은 아직 CodeSandbox에서 동작하지 않을 수 있습니다. (예: Fast Refresh)_

## Astro 배우기

사람들은 다양한 배경에서 각자 다른 학습 스타일로 Astro에 입문합니다. 이 섹션이 이론적인 접근 방식이나 실용적인 접근 방식을 선호하는 사람 모두에게 도움이 되기를 바랍니다.

- **직접 경험하며 배우는** 방식을 선호한다면, [예제 라이브러리](https://github.com/snowpackjs/astro/tree/main/examples)에서 시작해보세요.
- **개념부터 차근차근 익히는** 방식을 선호한다면, [기본 개념 가이드](/core-concepts/project-structure)에서 시작해보세요.

다른 낯선 기술과 마찬가지로 Astro에는 러닝 커브(learning curve)가 있습니다. 하지만 약간의 인내심을 가지고 연습한다면 충분히, 쉽게 습득할 수 있습니다.

### `.astro` 문법 배우기

Astro를 배우기 시작하면 많은 파일들이 `.astro` 확장자를 사용하고 있는 것이 눈에 띌 것입니다. 이것은 Astro의 **컴포넌트**를 의미합니다. Astro의 컴포넌트는 HTML과 비슷한 파일 포맷을 가지고 있으며 템플레이팅 (templating)에 사용됩니다. HTML이나 JSX를 사용해본 경험이 있는 사람이라면 누구나 익숙함을 느끼도록 설계되었습니다.

Astro 컴포넌트를 배우는 가장 좋은 방법은 이 문서의 [Astro 컴포넌트 가이드](/core-concepts/astro-components)를 읽는 것입니다. Astro 컴포넌트 페이지에서는 기본 문법을 익히는 데 도움 되는 가이드를 제공합니다.

### API 참조

API 참조 섹션은 특정 Astro API를 자세히 배우고 싶을 때 유용합니다. 예를 들어, [환경 설정](/reference/configuration-reference) 페이지는 설정에 적용 가능한 모든 옵션을 제공하며, [내장 컴포넌트](/reference/builtin-components) 페이지는 `<Markdown />`이나 `<Prism />`과 같은 핵심적인 컴포넌트들의 목록을 보여줍니다.

### 버전 관리된 문서

이 문서는 항상 최신 안정 버전의 Astro를 반영합니다. 이전 버전의 문서를 열람하는 기능은 Astro가 1.0 버전에 도달한 이후에 제공될 예정입니다.

## 최신 소식 받아보기

[@astrodotbuild](https://twitter.com/astrodotbuild) 트위터 계정을 통해 Astro 팀이 게시하는 공식적인 업데이트 소식을 받아볼 수 있습니다. 

또한 [디스코드](https://astro.build/chat)의 #announcements 채널에서도 릴리즈 소식을 찾아볼 수 있습니다. 

모든 릴리즈가 블로그에 게시되는 것은 아닙니다. 블로그에 게시되지 않은 버전 릴리즈에 관한 자세한 수정사항은 [Astro 리포지터리 안의 `CHANGELOG.md`](https://github.com/snowpackjs/astro/blob/main/packages/astro/CHANGELOG.md) 파일에서 읽어볼 수 있습니다.

## 빠진 항목이 있나요?

문서에서 빠진 항목을 발견하거나 혼동되는 부분이 있다면 개선을 위한 제안과 함께 [문서의 리포지터리](https://github.com/snowpackjs/astro/issues/new/choose)에 이슈를 올리거나 [@astrodotbuild](https://twitter.com/astrodotbuild) 트위터 계정으로 트윗해주세요. 여러분의 참여를 기다립니다!

## 크레딧

이 시작하기 가이드는 [React](https://reactjs.org/)의 시작하기 가이드를 참고하여 제작되었습니다.