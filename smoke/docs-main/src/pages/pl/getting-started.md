---
layout: ~/layouts/MainLayout.astro
title: Na początek
description: Wprowadzenie do Astro.
---

Astro to progresywny generator stron statycznych. Więcej możesz dowiedzieć się na [naszej stronie](https://astro.build/) oraz [w poście na blogu](https://astro.build/blog/introducing-astro). Ta strona jest wstępem do dokumentacji Astro i powiązanych zasobów.

## Wypróbuj Astro

Najprostszym sposobem, aby wypróbować Astro jest użycie komendy `npm init astro` w nowym katalogu. Kreator projektu pomoże Ci wystartować z nowym projektem Astro.

Możesz zacząć z Astro w 5 szybkich i łatwych krokach, odwiedź [Szybki start](/quick-start)
lub przeczytaj [Poradnik instalacyjny](/installation) w celu uzyskania pełnych instrukcji krok po kroku jak zacząć z Astro.

### Przykładowe projekty

Jeśli preferujesz uczyć się Astro z przykładów, zobacz naszą [bibliotekę przykładów](https://github.com/withastro/astro/tree/main/examples) na GitHubie.

Możesz także skorzystać z tych przykładów na swojej lokalnej maszynie uruchamiając `npm init astro` z parametrem `--template` w konsoli. Parametr `--template` wspiera także nieoficjalne szablony społeczności.

```bash
# Uruchomienie kreatora z oficjalnym szablonem
npm init astro -- --template [NAZWA_OFICJALNEGO_PRZYKŁADU]
# Uruchomienie kreatora z szablonem społeczności
npm init astro -- --template [UZYTKOWNIK_GITHUB]/[NAZWA_REPOZYTORIUM]
# lub
npm init astro -- --template [UZYTKOWNIK_GITHUB]/[NAZWA_REPOZYTORIUM]/sciezka/do/przykladu
```

### Piaskownice Online

Jeżeli chciałbyś pobawić się z Astro w swojej przeglądarce, możesz w mgnieniu oka odpalić nowy projekt Astro za pomocą naszego interfejsu na [astro.new](https://astro.new/).

Możesz wypróbować Astro w edytorach kodu online takich jak Stackblitz, CodeSandbox, Gitpod, i GitHub Codespaces. Kliknij w link "Open in Stackblitz" przy jednym z przykładów w naszej [bibliotece przykładów](https://github.com/withastro/astro/tree/main/examples). Albo, [kliknij tutaj](https://stackblitz.com/fork/astro) aby stworzyć nowy projekt na platformie [Stackblitz](https://stackblitz.com/fork/astro).

## Poznaj Astro

Różni ludzie, z różnych środowisk mają odmienne podejście do zaznajamiania się z technologiami. Niezależnie od tego, czy wolisz bardziej teoretyczne, czy praktyczne podejście, mamy nadzieję, że ta sekcja będzie dla Ciebie pomocna.

- Jeżeli preferujesz **praktykę**, zacznij z naszą [biblioteką przykładów](https://github.com/withastro/astro/tree/main/examples).
- Jeżeli preferujesz **teoretyczne podejście**, zacznij od [podstawowych konceptów i poradników](/core-concepts/project-structure).

Podobnie jak z innymi nieznanymi technologiami, Astro również wymaga poświęcenia chwili na naukę podstaw. Mamy nadzieję, że z odrobiną praktyki i cierpliwości poradzisz sobie z tym w krótkim czasie.

### Poznaj składnię `.astro`

Na początku swojej drogi z Astro zobaczysz, że wiele plików używa rozszerzenia `.astro`. Jest to **Składnia Komponentów Astro**: specjalny format pliku podobny do HTML'a, który używany jest w Astro do tworzenia szablonów. Został on stworzony, aby wyglądał znajomo dla każdej osoby mającej doświadczenie z HTML'em lub JSX'em.

Nasz poradnik - [Komponenty Astro](/core-concepts/astro-components) zapozna Cię ze składnią i w naszej ocenie jest najlepszym sposobem, aby się tego nauczyć.

### Referencje API

Ta sekcja jest szczególnie przydatna gdy chcesz poznać więcej szczegółów na temat konkretnego API w Astro. Na przykład, [Refencja Konfiguracji](/reference/configuration-reference) zawiera dostępne opcje konfiguracji. [Referencja Wbudowanych Komponentów](/reference/builtin-components) zawiera listę wbudowanych komponentów wewnętrznych, takich jak m.in `<Markdown />` i `<Code />`.

### Wersjonowanie dokumentacji

Dokumentacja zawsze odnosi się to najnowszej stabilnej wersji Astro. Gdy osiągniemy wydanie 1.0, pojawi się możliwość wyświetlania dokumentacji z podziałem na wersje.

## Jak być na bieżąco

[@astrodotbuild](https://twitter.com/astrodotbuild) to oficjalne konto na Twitterze oraz źródło dla wszelkich aktualizacji od zespołu Astro.

Publikujemy także ogłoszenia dotyczące nowych wydań Astro na [Discordzie](https://astro.build/chat) na kanale #announcements.

Nie każde wydanie Astro zasługuje na osobny post na blogu, ale możesz znaleźć szczegółową listę zmian dla każdej wersji w pliku [`CHANGELOG.md` w naszym repozytorium](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md).

## Czegoś brakuje?

Jeżeli czegoś brakuje w dokumentacji albo coś cię zaniepokoiło [uzupełnij formularz "issue" na GitHubie](https://github.com/withastro/astro/issues/new/choose) wraz ze swoimi sugestiami i przemyśleniami albo daj znać poprzez Twittera [@astrodotbuild](https://twitter.com/astrodotbuild). Czekamy na twoją opinię!

## Podziękowania

Ten wstęp został podpierdzielony od analogicznego poradnika dla [React'a](https://reactjs.org/docs/getting-started.html).
