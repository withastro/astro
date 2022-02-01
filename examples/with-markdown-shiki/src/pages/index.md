---
title: Shiki demo
layout: ../layouts/main.astro
---

# Shiki demo

JavaScript

```js
var foo = 'bar';

function doSomething() {
  return foo;
}
```

Custom language (rinfo)

```rinfo
programa Rinfo
areas
  ciuadad: AreaC(1,1,100,100)
robots
  robot robot1
  comenzar
    Informar(PosAv, PosCa)
  fin
variables
  Rinfo: robot1
comenzar
  AsignarArea(Rinfo, ciudad)
  Iniciar(Rinfo, 1, 1)
fin
```

[More customizations](/custom)
