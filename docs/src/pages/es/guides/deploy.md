---
layout: ~/layouts/MainLayout.astro
title: Desplegar en la web
lang: es
---

Las siguientes guías se basan en algunos supuestos compartidos:

- Estás utilizando la ubicación de salida de compilación predeterminada (`dist/`). Esta ubicación [se puede cambiar usando la opción de configuración `dist`](/es/reference/configuration-reference).
- Estás usando npm. Puedes usar comandos equivalentes para ejecutar los scripts si estás usando Yarn u otros administradores de paquetes.
- Astro está instalado como una dependencia de desarrollo local en su proyecto, y has configurado los siguientes scripts npm:

```json
{
  "scripts": {
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

## Construyendo la aplicación

Puedes ejecutar el comando `npm run build` para compilar la aplicación.

```bash
$ npm run build
```

Por defecto, la salida de la compilación se colocará en `dist/`. Puedes desplegar esta carpeta `dist/` en cualquiera de tus plataformas preferidas.

## Páginas de GitHub

> **Advertencia:** De forma predeterminada, las páginas de Github romperán el directorio `_astro/` de su sitio web desplegado. Para deshabilitar este comportamiento y solucionar este problema, asegúrate de usar el script `deploy.sh` de abajo o agrega manualmente un archivo `.nojekyll` vacío a tu directorio `public/`.

1. Establece el `buildOptions.site` correcto en `astro.config.mjs`.
2. Dentro de tu proyecto, crea `deploy.sh` con el siguiente contenido (sin comentar las líneas apropiadas) y ejecútalo para implementar:

   ```bash{13,20,23}
   #!/usr/bin/env sh

   # abortar en errores
   set -e

   # construir
   npm run build

   # navegar hasta el directorio de salida de la compilación
   cd dist

   # añade .nojekyll para omitir el comportamiento predeterminado de las páginas de GitHub
   touch .nojekyll

   # si estás implementando en un dominio personalizado
   # echo 'www.example.com' > CNAME

   git init
   git add -A
   git commit -m 'deploy'

   # si estás desplegando en https://<USERNAME>.github.io
   # git push -f git@github.com:<USERNAME>/<USERNAME>.github.io.git main

   # si estás desplegando en https://<USERNAME>.github.io/<REPO>
   # git push -f git@github.com:<USERNAME>/<REPO>.git main:gh-pages

   cd -
   ```

   > También puedes ejecutar el script anterior en tu configuración de CI para habilitar la implementación automática en cada envío.

### GitHub Actions

1. En el repositorio del proyecto astro, crea la rama `gh-pages`, luego ve a Configuración > Páginas y establece la rama `gh-pages` para las Páginas de GitHub y establece el directorio en `/` (raíz).
2. Establezca el `buildOptions.site` correcto en `astro.config.mjs`.
3. Crea el archivo `.github/workflows/main.yml` y agrega el yaml de abajo. Asegúrate de editar con tus propios datos.
4. En GitHub, ve a Configuración > Configuración de desarrollador > Tokens de acceso personal. Genere un nuevo token con permisos de repositorio.
5. En el repositorio del proyecto Astro (no \<SU NOMBRE DE USUARIO\>.github.io) ve a Configuración > Secretos y agregue tu nuevo token de acceso personal con el nombre `API_TOKEN_GITHUB`.
6. Cuando envíes cambios al repositorio del proyecto Astro, CI los desplegará en \<SU NOMBRE DE USUARIO \>.github.io por ti.

```yaml
# Flujo de trabajo para compilar y desplegar en tus páginas de GitHub del repositorio.

# Edita los detalles de tu proyecto aquí.
# ¡Recuerda agregar API_TOKEN_GITHUB en Configuración del repositorio > Secretos también!
env:
  githubEmail: <YOUR GITHUB EMAIL ADDRESS>
  deployToRepo: <NAME OF REPO TO DEPLOY TO (E.G. <YOUR USERNAME>.github.io)>

name: Github Pages Astro CI

on:
  # Activa el flujo de trabajo en eventos de push y pull requests, pero solo para la rama principal
  push:
    branches: [main]
  pull_request:
    branches: [main]

  # Permite ejecutar este flujo de trabajo manualmente desde la pestaña Acciones.
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Registra tu repositorio en $GITHUB_WORKSPACE, para que tu trabajo pueda acceder a él.
      - uses: actions/checkout@v2

      # Instalar dependencias con npm
      - name: Install dependencies
        run: npm ci

      # Construye el proyecto y agrega el archivo .nojekyll para suprimir el comportamiento predeterminado
      - name: Build
        run: |
          npm run build
          touch ./dist/.nojekyll

      # Hace push a tu repositorio de páginas
      - name: Push to pages repo
        uses: cpina/github-action-push-to-another-repository@main
        env:
          API_TOKEN_GITHUB: ${{ secrets.API_TOKEN_GITHUB }}
        with:
          source-directory: 'dist'
          destination-github-username: ${{ github.actor }}
          destination-repository-name: ${{ env.deployToRepo }}
          user-email: ${{ env.githubEmail }}
          commit-message: Deploy ORIGIN_COMMIT
          target-branch: gh-pages
```

### Travis CI

1. Set the correct `buildOptions.site` in `astro.config.mjs`.
2. Create a file named `.travis.yml` in the root of your project.
3. Run `npm install` locally and commit the generated lockfile (`package-lock.json`).
4. Use the GitHub Pages deploy provider template, and follow the [Travis CI documentation](https://docs.travis-ci.com/user/deployment/pages/).

   ```yaml
   language: node_js
   node_js:
     - lts/*
   install:
     - npm ci
   script:
     - npm run build
   deploy:
     provider: pages
     skip_cleanup: true
     local_dir: dist
     # A token generated on GitHub allowing Travis to push code on you repository.
     # Set in the Travis settings page of your repository, as a secure variable.
     github_token: $GITHUB_TOKEN
     keep_history: true
     on:
       branch: master
   ```

## GitLab Pages

1. Establece el `buildOptions.site` correcto en `astro.config.mjs`.
2. Establece `build` en `astro.config.mjs` a `public` y `public` en `astro.config.mjs` a una carpeta recién nombrada que contiene todo lo que se encuentra actualmente en `public`. El razonamiento es porque `public` es una segunda carpeta de origen en astro, por lo que si desea generar la salida a `public`, deberá extraer los activos públicos de una carpeta diferente.
3. Crea un archivo llamado `.gitlab-ci.yml` en la raíz de su proyecto con el contenido de abajo. Esto creará y desplegará su sitio cada vez que realice cambios en su contenido:

   ```yaml
   image: node:10.22.0
   pages:
     cache:
       paths:
         - node_modules/
     script:
       - npm install
       - npm run build
     artifacts:
       paths:
         - public
     only:
       - master
   ```

## Netlify

**Nota:** Si está utilizando una [imagen de compilación](https://docs.netlify.com/configure-builds/get-started/#build-image-selection) antigua  en Netlify, asegúrate de configurar tu versión de Node.js en un archivo [`.nvmrc`](https://github.com/nvm-sh/nvm#nvmrc) (ejemplo:` node v14.17.6`) o una variable de entorno `NODE_VERSION`. Este paso ya no es necesario de forma predeterminada.

Puedes configurar tu implementación de dos maneras, a través del sitio web de Netlify o con un archivo de proyecto local `netlify.toml`.

### `netlify.toml` file

Crea un nuevo archivo `netlify.toml` en el nivel superior del repositorio de su proyecto con la siguiente configuración:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

Empuja el nuevo archivo `netlify.toml` a tu repositorio de git alojado. Luego, configura un nuevo proyecto en [Netlify](https://netlify.com) para tu repositorio de git. Netlify leerá este archivo y configurará automáticamente su implementación.

### Interfaz de usuario del sitio web de Netlify

Puedes omitir el archivo `netlify.toml` e ir directamente a [Netlify](https://netlify.com) para configurar tu proyecto. Netlify ahora debería detectar los proyectos de Astro automáticamente y pre-rellenar la configuración por ti. Asegúrate de introducir la siguiente configuración antes de presionar el botón "Desplegar":

- **Comando de construcción:** `astro build` o `npm run build`
- **Publicar directorio:** `dist`

## Google Firebase

1. Asegúrate de tener [firebase-tools](https://www.npmjs.com/package/firebase-tools) instalado.

2. Crea `firebase.json` y `.firebaserc` en la raíz de tu proyecto con el siguiente contenido:

   `firebase.json`:

   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": []
     }
   }
   ```

   `.firebaserc`:

   ```js
   {
    "projects": {
      "default": "<YOUR_FIREBASE_ID>"
    }
   }
   ```

3. Después de ejecutar `npm run build`, despliega usando el comando `firebase deploy`.

## Surge

1. Primero instala [surge](https://www.npmjs.com/package/surge), si aún no lo has hecho.

2. Ejecuta `npm run build`.

3. Despliega en Surge escribiendo `surge dist`.

También puedes implementar en un [dominio personalizado](http://surge.sh/help/adding-a-custom-domain) agregando `surge dist yourdomain.com`.

## Heroku

1. Instalar [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).

2. Crea una cuenta en Heroku [registrándose](https://signup.heroku.com).

3. Ejecuta `heroku login` y completa tus credenciales de Heroku:

   ```bash
   $ heroku login
   ```

4. Crea un archivo llamado `static.json` en la raíz de su proyecto con el siguiente contenido:

   `static.json`:

   ```json
   {
     "root": "./dist"
   }
   ```

   Esta es la configuración de su sitio; leer más en [heroku-buildpack-static](https://github.com/heroku/heroku-buildpack-static).

5. Configura tu git remoto de Heroku:

   ```bash
   # cambio de versión
   $ git init
   $ git add .
   $ git commit -m "My site ready for deployment."

   # crear una nueva aplicación con un nombre específico
   $ heroku apps:create example

   # establecer buildpack para sitios estáticos
   $ heroku buildpacks:set https://github.com/heroku/heroku-buildpack-static.git
   ```

6. Implemente su sitio:

   ```bash
   # publicar sitio
   $ git push heroku master

   # abre un navegador para ver la tablero de version de Heroku CI
   $ heroku open
   ```

## Vercel

Para implementar tu proyecto Astro con [Vercel para Git](https://vercel.com/docs/git), asegúrate de que lo has enviado a un repositorio de Git.

Ve a https://vercel.com/import/git e importa el proyecto en Vercel utilizando tu elección de Git (GitHub, GitLab o BitBucket). Sigue el asistente para seleccionar la raíz del proyecto con el `package.json` del proyecto y anula el paso de compilación usando `npm run build` y el directorio de salida sea `./dist`.

Una vez que se has importado tu proyecto, todos los envíos posteriores a las ramas generarán vistas previas de desarrollos y todos los cambios realizados en la rama de producción (comúnmente "main") darán como resultado un despliegue de producción.

Una vez desplegado, obtendrás una URL para ver tu aplicación en vivo, como la siguiente: https://astro.vercel.app

## Aplicaciones web estáticas de Azure

Puedes implementar tu proyecto Astro con el servicio Microsoft Azure [Static Web Apps](https://aka.ms/staticwebapps). Necesitas:

- Una cuenta de Azure y una clave de suscripción. Aquí puedes crear una [cuenta gratuita de Azure](https://azure.microsoft.com/free).
- El código de tu aplicación enviado a [GitHub](https://github.com).
- La [Extensión SWA](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps) en [Visual Studio Code](https://code.visualstudio.com).

Instala la extensión en VS Code y navega hasta la raíz de tu aplicación. Abre la extensión Static Web Apps, inicia sesión en Azure y haz clic en el signo '+' para crear una nueva Static Web App. Se te pedirá que designes qué clave de suscripción utilizar.

Sigue el asistente iniciado por la extensión para darle un nombre a tu aplicación, elige un framework preestablecido y designa la raíz de la aplicación (generalmente `/`) y la ubicación del archivo construido `/dist`. El asistente se ejecutará y creará una acción de GitHub en su repositorio en una carpeta `.github`.

La acción funcionará para desplegar tu aplicación (observa su progreso en la pestaña Acciones de tu repositorio) y, cuando se complete con éxito, podrá ver su aplicación en la dirección proporcionada en la ventana de progreso de la extensión haciendo clic en el botón 'Explorar sitio web' que aparece cuando el la acción de GitHub se ha ejecutado.

## Cloudflare Pages

Puedes implementar tu proyecto Astro en [Cloudflare Pages](https://pages.cloudflare.com). Necesitas:

- Una cuenta de Cloudflare. Si aún no tienes una, puedes crear una cuenta gratuita de Cloudflare durante el proceso.
- El código de tu aplicación enviado a un repositorio de [GitHub](https://github.com).

Luego, configura un nuevo proyecto en Cloudflare Pages.

Utiliza la siguiente configuración de compilación:

- **Framework preestablecido**: `Ninguno` (Al momento de escribir este artículo, Astro no está en la lista).
- **Comando de compilación**: `astro build` o `npm run build`
- **Directorio de salida de compilación**: `dist`
- **Variables de entorno (avanzadas)**: agrega una variable de entorno con el **Nombre de variable** de `NODE_VERSION` y un **Valor** de una [Versión de node que es compatible con Astro](https://docs.astro.build/installation#prerequisites), ya que la versión predeterminada de Cloudflare Pages probablemente no funcione.

Entonces haz clic en el botón **Guardar y Desplegar**.

## Render

Puedes desplegar tu proyecto Astro en [Render](https://render.com/) siguiendo estos pasos:

1. Crea una [cuenta en render.com](https://dashboard.render.com/) e inicia sesión.
2. Haz clic en el botón **Nuevo +** de tu panel y selecciona **Sitio estático**.
3. Conecta tu repositorio de [GitHub](https://github.com/) o [GitLab](https://about.gitlab.com/) o, alternativamente, introduce la URL pública de un repositorio público.
4. Asigna un nombre a tu sitio web, selecciona la rama y especifique el comando de compilación y el directorio de publicación.
    - **comando de compilación**: `npm run build`
    - **directorio de publicación**: `dist`
5. Haz clic en el botón **Crear sitio estático**.

## Créditos

Esta guía se basó originalmente en la guía de implementación estática bien documentada de [Vite](https://vitejs.dev/).
