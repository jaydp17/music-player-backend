const redis = require('redis');
const Promise = require('bluebird');
const { LISTENER_CHANGE_CHANNEL } = require('./channels-string');

Promise.promisifyAll(redis.RedisClient.prototype);

const client = redis.createClient();
const sub = redis.createClient();

sub.subscribe(LISTENER_CHANGE_CHANNEL);

const getRedisKeyForClient = clientId => `users:${clientId}`;
const getRedisKeyForSong = songId => `songs:${songId}`;

function removeClientFromSongsSet({ songId, clientId }) {
  const lastSongsKey = getRedisKeyForSong(songId);
  client.srem(lastSongsKey, clientId);
}

/**
 * Gets the number of listeners of a song
 * @returns {Promise<number>}
 */
function getSongListenerCount(songId) {
  const songsKey = getRedisKeyForSong(songId);
  return client.scardAsync(songsKey);
}

/**
 * Adds the user to the listeners of the given song
 */
async function startedListening(clientId, songId) {
  if (!clientId) throw new Error("clientId can't be empty");
  if (!songId) throw new Error("songId can't be empty");
  const usersKey = getRedisKeyForClient(clientId);
  const songsKey = getRedisKeyForSong(songId);
  const [lastSongId] = await Promise.all([
    // get the last song the client was listening to
    client.getAsync(usersKey),
    // add to current song listeners
    client.saddAsync(songsKey, clientId),
  ]);
  if (lastSongId) {
    // if lastSongId was found, remove client from the last song's set
    removeClientFromSongsSet({ songId: lastSongId, clientId });
    client.publish(LISTENER_CHANGE_CHANNEL, lastSongId);
  }

  // set the song the client is listening to right now
  client.set(usersKey, songId);
  if (lastSongId !== songId) {
    // publish update for songId
    client.publish(LISTENER_CHANGE_CHANNEL, songId);
  }
}

async function stoppedListening(clientId, songId) {
  if (!clientId) throw new Error("clientId can't be empty");
  const usersKey = getRedisKeyForClient(clientId);
  const lastSongId = await client.getAsync(usersKey);
  if (lastSongId) {
    // if lastSongId was found, remove client from the last song's set
    removeClientFromSongsSet({ songId: lastSongId, clientId });
    client.publish(LISTENER_CHANGE_CHANNEL, lastSongId);
  }
  if (songId && lastSongId !== songId) {
    // shouldn't happen, but in case there's some descripency in the data
    removeClientFromSongsSet({ songId, clientId });
  }
  // clear the song the client is listening to right now
  client.del(usersKey);

  if (songId && lastSongId !== songId) {
    // publish update for songId
    client.publish(LISTENER_CHANGE_CHANNEL, songId);
  }
}

async function onListenersChange(cb) {
  sub.on('message', async (channel, songId) => {
    if (channel !== LISTENER_CHANGE_CHANNEL) return;
    const listenerCount = await getSongListenerCount(songId);
    cb(null, { songId, listenerCount });
  });
}

/**
 * Gets the listener count for all songs
 */
async function getAllListenCount() {
  const keys = await client.keysAsync('songs:*');
  const songIds = keys.map(key => key.split(':')[1]);
  const listenerCounts = await Promise.map(songIds, getSongListenerCount);
  return keys.reduce((accumulator, eachKey, index) => ({ ...accumulator, [eachKey]: listenerCounts[index] }), {});
}

module.exports = {
  startedListening,
  stoppedListening,
  onListenersChange,
  getAllListenCount,
};
