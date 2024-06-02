
## Microservicio de Orders

Con base de datos Postgres.

Repositorio parte de curso https://www.udemy.com/course/nestjs-microservicios
del maestro Fernando Herrera.
EXCELENTE!

## Dev Steps 

1. Clonar repo
2. Instalar depencias:
```bash
$ npm install
```
3. Crear archivo `.env` basado en `env.template`
4. Correr docker compose para levantar server de PostGres
```bash
$ docker compose up -d
```
5. Levantar Servidor de NATS
```
docker run -d --name nats-server -p 4222:4222 -p 6222:6222 -p 8222:8222 nats
```
6. Ejecutar la app 
```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Documentos de ayuda

- https://docs.nestjs.com/recipes/prisma
- neon.tech (ofrecen bd postgres free tier)
- https://nats.io/
- https://docs.nestjs.com/microservices/nats


## Nest License

Nest is [MIT licensed](LICENSE).
