const redis = require('./redis');
const { LISTENER_CHANGE_CHANNEL, ALL_LISTEN_COUNT_CHANNEL } = require('./channels-string');

module.exports = io => {
  io.on('connection', async client => {
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
    const result = await redis.getAllListenCount();
    client.emit(ALL_LISTEN_COUNT_CHANNEL, result);
  });

  redis.onListenersChange((err, { songId, listenerCount }) => {
    if (err) {
      console.error('Error', err);
      return;
    }
    io.emit(LISTENER_CHANGE_CHANNEL, { songId, listenerCount });
  });
};
