const restify = require('restify');
const applyMiddlewares = require('./apply-middlewares');
const addRoutes = require('./routes');

const server = restify.createServer({
  name: 'music-player-backend',
  version: '1.0.0',
});
applyMiddlewares(server);
addRoutes(server);

server.listen(8080, () => {
  console.log('%s listening at %s', server.name, server.url);
});
