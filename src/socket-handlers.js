const redis = require('./redis');

module.exports = io => {
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
};
