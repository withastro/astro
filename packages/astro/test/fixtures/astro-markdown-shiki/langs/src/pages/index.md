---
layout: ../layouts/content.astro
---

# Hello world

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

```unknown
This language does not exist
```

```caddy
example.com {
	root * /var/www/wordpress
	encode gzip
	php_fastcgi unix//run/php/php-version-fpm.sock
	file_server
}
```
