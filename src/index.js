const restify = require('restify');
const s3Utils = require('./s3-utils');

const server = restify.createServer({
  name: 'music-player-backend',
  version: '1.0.0',
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.get('/echo/:name', (req, res, next) => {
  res.send(req.params);
  return next();
});

server.get('/song/:id', (req, res, next) => {
  const { id: songId } = req.params;
  const songStream = s3Utils.getSongStream(songId);
  if (songStream) {
    songStream.pipe(res);
  } else {
    next(new Error('steam not found'));
  }
});

server.listen(8080, () => {
  console.log('%s listening at %s', server.name, server.url);
});
