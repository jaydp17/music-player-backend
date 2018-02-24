const restify = require('restify');
const socketio = require('socket.io');
const applyMiddlewares = require('./apply-middlewares');
const addRoutes = require('./routes');
const redis = require('./redis');

const server = restify.createServer({
  name: 'music-player-backend',
  version: '1.0.0',
});
const io = socketio.listen(server.server);

applyMiddlewares(server);
addRoutes(server);

io.on('connection', client => {
  console.log('a user connected');

  client.on('start-listening', songId => {
    console.log(`${client.id} started listening to ${songId}`);
    redis.startedListening(client.id, songId);
  });
  client.on(`stop-listening`, songId => {
    console.log(`${client.id} stopped listening to ${songId}`);
    redis.stoppedListening(client.id, songId);
  });
  client.on('disconnect', () => {
    console.log(`${client.id} disconnected`);
    redis.stoppedListening(client.id, null);
  });
});

redis.onListenersChange((err, { songId, listenerCount }) => {
  if (err) {
    console.error('Error', err);
    return;
  }
  io.emit('listeners-change', { songId, listenerCount });
});

server.listen(8080, () => {
  console.log('%s listening at %s', server.name, server.url);
});
