const redis = require('./redis');
const {
  CONNECTION_CHANNEL,
  DISCONNECT_CHANNEL,
  LISTENER_CHANGE_CHANNEL,
  ALL_LISTEN_COUNT_CHANNEL,
  START_LISTENING_CHANNEL,
  STOP_LISTENING_CHANNEL,
} = require('./channels-string');

module.exports = io => {
  io.on(CONNECTION_CHANNEL, async client => {
    client.on(START_LISTENING_CHANNEL, songId => redis.startedListening(client.id, songId));
    client.on(STOP_LISTENING_CHANNEL, songId => redis.stoppedListening(client.id, songId));
    client.on(DISCONNECT_CHANNEL, () => redis.stoppedListening(client.id, null));
    const result = await redis.getAllListenCount();
    client.emit(ALL_LISTEN_COUNT_CHANNEL, result);
  });

  redis.onListenersChange((err, { songId, listenerCount }) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error('Error', err);
      return;
    }
    if (songId) {
      io.emit(LISTENER_CHANGE_CHANNEL, { songId, listenerCount });
    }
  });
};
