const restify = require('restify');
const socketio = require('socket.io');
const applyMiddlewares = require('./apply-middlewares');
const addRoutes = require('./routes');
const addSocketHandlers = require('./socket-handlers');

const server = restify.createServer({
  name: 'music-player-backend',
  version: '1.0.0',
});
const io = socketio.listen(server.server);

applyMiddlewares(server);
addRoutes(server);
addSocketHandlers(io);

server.listen(8080, () => {
  // eslint-disable-next-line no-console
  console.log('%s listening at %s', server.name, server.url);
});
