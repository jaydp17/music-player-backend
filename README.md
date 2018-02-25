# Music Player Backend

A really simple implementation of a server that streams mp3 files from AWS S3 to the client.

## ✨ Features

* Tracks the number of people listening to a song
* Brings its own MetaData server

## 💾 Pre-requisites

* [docker](https://www.docker.com/)
* [docker-compose](https://docs.docker.com/compose/install/)

## ▶️ Usage

```sh
# copy .env.example to .env
$ cp .env.example .env

# make necessary changes in .env
$ vim .env

$ docker-compose up -d
# it will spin up
#   - Redis
#   - MetaData Server
#   - API Server
```

## 🎓 License

MIT
