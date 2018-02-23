const restify = require('restify');

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

server.listen(8080, () => {
  console.log('%s listening at %s', server.name, server.url);
});
