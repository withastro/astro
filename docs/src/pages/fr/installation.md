---
layout: ~/layouts/MainLayout.astro
title: Installation
lang: fr
---

Il y a plusieurs façons d'installer Astro dans un nouveau projet.

## Prérequis

- **Node.js** - `v12.20.0`, `v14.13.1`, `v16.0.0`, or plus.
- **Éditeur de texte** - Privilégiez [VS Code](https://code.visualstudio.com/) et [l'extension Astro officielle](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode).
- **Terminal** - Astro s'utilise principalement en ligne de commande.

Ce guide utilise [`npm`](https://www.npmjs.com/) dans les exemples ci-après, mais vous pouvez utiliser [`yarn`](https://yarnpkg.com/) ou [`pnpm`](https://pnpm.io/) si vous y êtes habitué·e.

## Initialisation complète

`npm init astro` est le moyen le plus facile de créer un nouveau projet avec Astro. Entrez cette commande dans un terminal pour lancer `create-astro`, l'assistant d'installation.

```bash
# Avec NPM
npm init astro

# Yarn
yarn create astro
```

L'assistant d'installation [`create-astro`](https://github.com/snowpackjs/astro/tree/main/packages/create-astro) vous propose de choisir entre différents [squelettes d'application](/examples), mais offre aussi la possibilité d'importer un projet Astro directement depuis GitHub.

```bash
# Note : remplacez "my-astro-project" avec le nom de votre projet.

# npm 6.x
npm init astro my-astro-project --template starter
# npm 7+ (tiret -- supplémentaire)
npm init astro my-astro-project -- --template starter
# yarn
yarn create astro my-astro-project --template starter
# À partir d'un template disponible sur GitHub
npm init astro my-astro-project -- --template [GITHUB_USER]/[REPO_NAME]
# ... ou si ce template ce trouve à l'intérieur d'un dépôt GitHub
npm init astro my-astro-project -- --template [GITHUB_USER]/[REPO_NAME]/path/to/template
```

Après que `create-astro` a mis en place l'architecture de votre projet, n'oubliez pas d'installer les dépendances avec npm, yarn ou pnpm. Par exemple avec npm:

```bash
npm install
```

Vous pouvez maintenant [lancer](#démarrer-astro) votre projet. Une fois votre projet prêt à être déployé, vous pourrez [le compiler](#compiler-avec-astro). Astro va empaqueter votre application et produire les fichiers statiques nécessaires pour que vous puissiez [déployer](/guides/deploy) votre application.

## Installation manuelle

Vous pouvez installer Astro en vous passant de l'assistant `create-astro` avec les quelques étapes suivantes.

### Créer un projet

```bash
# Créez et placez vous dans un nouveau dossier
mkdir my-astro-project
cd my-astro-project
```

### Créer un `package.json`

```bash
# Cette commande va créer un fichier package.json basique
npm init --yes
```

Astro est conçu pour fonctionner avec tout l'ecosystème npm. Cela est rendu possible par un fichier de projet nommé `package.json` à la racine de votre projet. Si vous n'êtes pas familier·e avec le fichier `package.json`, nous vous recommandons fortement de lire [la documentation officielle sur le site de npm](https://docs.npmjs.com/creating-a-package-json-file).

### Installer Astro

En suivant les instructions précédentes, vous devriez avoir un dossier avec un seul fichier `package.json` dedans. Vous pouvez maintenant ajouter Astro à votre projet.

```bash
npm install astro
```

Vous pouvez aussi remplacer la section "scripts" du fichier `package.json` avec les lignes suivantes :

```diff
  "scripts": {
-    "test": "echo \"Error: no test specified\" && exit 1"
+    "dev": "astro dev",
+    "build": "astro build"
  },
}
```

La commande [`dev`](#start-astro) démarre le serveur de développement Astro à l'adresse `http://localhost:3000`. Une fois votre projet terminé, la commande [`build`](#build-astro) produit votre site dans le dossier `dist/`. [En savoir plus sur le déploiement d'un site développé avec Astro.](/guides/deploy)

### Créer une première page

Ouvrez votre éditeur favori, et créez un nouveau fichier :

1. Créez un nouveau fichier à l'emplacement `src/pages/index.astro`.
2. Copiez-collez l'extrait suivant (`---` compris) dedans.

```astro
---
// Le code JS/TS écrit entre les (---) n'est exécuté que par le serveur
console.log('Coucou dans le terminal')
---

<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>

<style lang="scss">
  body {
    h1 {
      color: orange;
    }
  }
</style>

<script>
  // Le code JS écrit ici n'est exécuté que dans le navigateur
  console.log('Coucou dans la console du navigateur')
</script>
```

Vous venez de lire un exemple de syntaxe des composants Astro, inspirée par le HTML et le JSX.

Vous pouvez continuer à ajouter des fichiers dans le dossier `src/pages`, et Astro se servira du nom du fichier pour ajouter des pages à votre site. Par exemple, si vous ajoutez une page `src/pages/a-propos.astro` (par exemple en reprenant le code ci-dessus), Astro va générer une nouvelle page à l'adresse `http://localhost:3000/a-propos`.

## [Démarrer Astro](#démarrer-astro)

```bash
npm run dev
```

Astro va démarrer votre site à l'adresse `http://localhost:3000`. En ouvrant cette URL dans votre navigateur, vous devriez voir s'afficher "Hello, World", ou bien la page créée précédemment.

## [Compiler avec Astro](#compiler-avec-astro)

```bash
npm run build
```

Astro va produire une version allégée du site et la sauvegarder directement sur le disque. Votre application se trouvera dans le dossier `dist/`.

## Prochaines étapes

Vous êtes désormais prêt·e à développer !

Nous vous recommandons de prendre le temps de vous familiariser avec Astro et son fonctionnement. Nous vous recommandons les guides suivants :

📚 En savoir plus sur [la structure des projets Astro](/core-concepts/project-structure).

📚 En savoir plus sur [la syntaxe des composants Astro](/core-concepts/astro-components).

📚 En savoir plus sur [la génération des adresses à partir de l'arborescence.](/core-concepts/astro-pages).
