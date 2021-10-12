---
layout: ~/layouts/MainLayout.astro
title: Referencia de CLI
lang: es
---

## Comandos

### `astro dev`

Ejecuta el servidor de desarrollo de Astro. Esto inicia un servidor HTTP que responde a las solicitudes de páginas almacenadas en `src/pages` (o la carpeta que se especifique en tu [configuración](/es/reference/configuration-reference)).

**Flags**

#### `--port`

Especifica el puerto en el que se ejecutará. El valor predeterminado es `3000`.

### `astro build`

Crea tu sitio para producción.

### `astro preview`

Inicia un servidor de archivos estático local para servir tu directorio `dist/` construido. Útil para obtener una vista previa de tu compilación estática localmente, antes de desplegarla.

Este comando está destinado únicamente a pruebas locales y no está diseñado para ejecutarse en producción. Para obtener ayuda con el alojamiento de producción, consulta nuestra guía sobre [DEspliegue de un sitio web Astro](/es/guides/deploy).

## Global Flags

### `--config path`

Especifica la ruta al archivo de configuración. El valor predeterminado es `astro.config.mjs`. Use esto si usas un nombre diferente para su archivo de configuración o tienes tu archivo de configuración en otra carpeta.

```shell
astro --config config/astro.config.mjs dev
```

### `--project-root path`

Especifica la ruta a la raíz del proyecto. Si no se especifica, se supone que el directorio de trabajo actual es la raíz.

La raíz se utiliza para encontrar el archivo de configuración de Astro.

```shell
astro --project-root examples/snowpack dev
```

### `--reload`

Borra la caché (las dependencias se crean dentro de las aplicaciones Astro).

### `--verbose`

Habilita el registro detallado, que es útil al depurar un problema.

### `--silent`

Habilita el registro silencioso, que es útil cuando no deseas ver los registros de Astro.

### `--version`

Imprima el número de versión de Astro y sale.

### `--help`

Imprime el mensaje de ayuda y sale.
