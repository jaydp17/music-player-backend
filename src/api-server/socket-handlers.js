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
    // whenever someone starts/stops listening to a song
    // inform redis
    client.on(START_LISTENING_CHANNEL, songId => redis.startedListening(client.id, songId));
    client.on(STOP_LISTENING_CHANNEL, songId => redis.stoppedListening(client.id, songId));

    // whenever a user disconnects, clear his last playing song
    client.on(DISCONNECT_CHANNEL, () => redis.stoppedListening(client.id, null));

    // this user just connected, send him all the current listening stats
    const result = await redis.getAllListenCount();
    client.emit(ALL_LISTEN_COUNT_CHANNEL, result);
  });

  // register a callback for updates
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
