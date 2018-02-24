const restify = require('restify');
const socketio = require('socket.io');
const applyMiddlewares = require('./apply-middlewares');
const addRoutes = require('./routes');

const server = restify.createServer({
  name: 'music-player-backend',
  version: '1.0.0',
});
const io = socketio.listen(server.server);

applyMiddlewares(server);
addRoutes(server);

io.on('connection', socket => {
  console.log('a user connected');
  socket.broadcast.emit('listeners-change', { songId: 'hello', listeners: 10 });
});

server.listen(8080, () => {
  console.log('%s listening at %s', server.name, server.url);
});
