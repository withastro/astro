---
layout: ~/layouts/MainLayout.astro
title: Comienzo rápido
lang: es
---

```shell
# prerrequisitos: revisa que Node.js está en la versión 14.15.0+, ó 16+
node --version

# crea un nuevo proyecto en el directorio y entra a él
mkdir my-astro-project && cd $_

# inicializa el proyecto...
npm init astro

# instala las dependencias
npm install

# comienza con el desarrollo
npm run dev
```

Para los sitios de producción,

```shell
# cuando estés listo: crea tu sitio estático en la carpeta `dist/`
npm run build
```

Para saber más sobre la instalación y uso de Astro por primera vez, por favor [lea nuestra guía de instalación.](installation)

Si prefieres aprender con ejemplos, revisa nuestra [librería completa de ejemplos](https://github.com/withastro/astro/tree/main/examples) en GitHub. Puedes revisar cualquiera de estos ejemplos localmente ejecutando `npm init astro -- --template "EXAMPLE_NAME"`.

## Comienza con tu proyecto

Dentro del directorio de tu proyecto, ingresa el siguiente comando en la terminal:

```bash
npm run dev
```

Astro comenzará a correr en el servidor de desarrollo en [http://localhost:3000](http://localhost:3000). Abre esta ubicación en tu navegador, deberías ver la página de "¡Hola Mundo!" de Astro.

El servidor escuchará los cambios en vivo de los archivos en tu carpeta `src/`, así que, no necesitarás reiniciar la aplicación cuando hagas cambios durante el desarrollo.

## Construye tu proyecto

Para construir tu proyecto, ingresa el siguiente comando en la terminal:

```bash
npm run build
```

Este comando hará que Astro cree y guarde tu sitio estático en la carpeta `dist/` de tu proyecto.

## Desplega tu proyecto

Los sitios de Astro son estáticos, por lo que puedes desplegarlos en tu servicio de host favorito:

- [AWS S3 bucket](https://aws.amazon.com/s3/)
- [Google Firebase](https://firebase.google.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)
- [Lee más acerca del despliegue con nuestra guía de despliegue de Astro.](/es/guides/deploy)

## Próximos Pasos

¡Felicitaciones! Ahora estás listo para comenzar a desarrollar.

Te recomendamos que te tomes tu tiempo para familiarizarte con la forma en la que Astro. Lo puedes hacer al explorar con mayor profundidad nuestra documentación. Te sugerimos que consideres lo siguiente.

📚 Aprende más sobre la estructura de proyectos de Astro, en nuestra [guía de estructura de proyecto](/es/core-concepts/project-structure).

📚 Aprende más sobre la sintaxis de los componentes de Astro, en nuestra [guía de componentes de Astro](/es/core-concepts/astro-components).

📚 Aprende más sobre la rutas basada en archivos de Astro, en nuestra [guía de rutas](core-concepts/astro-pages).
