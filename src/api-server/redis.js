const redis = require('redis');
const Promise = require('bluebird');
const { LISTENER_CHANGE_CHANNEL } = require('./channels-string');
const { redisHost } = require('./config');

Promise.promisifyAll(redis.RedisClient.prototype);

const client = redis.createClient({ host: redisHost });
const sub = redis.createClient({ host: redisHost });

sub.subscribe(LISTENER_CHANGE_CHANNEL);

const getRedisKeyForClient = clientId => `users:${clientId}`;
const getRedisKeyForSong = songId => `songs:${songId}`;

/**
 * Removes `clientId` from the set `songs:<SONG_ID>`
 * @param {Object} data
 * @param {string} data.songId - The id of the song (eg. fc02ff53-4c18-48c2-9ec1-6ca4fdd46a37)
 * @param {string} data.clientId - The id of the client connected over websocket
 *
 * Example:
 *  songs:<SONG_ID> = Set{CLIENT_1, CLIENT_2, CLIENT_3, ...}
 */
function removeClientFromSongsSet({ songId, clientId }) {
  const lastSongsKey = getRedisKeyForSong(songId);
  client.srem(lastSongsKey, clientId);
}

/**
 * Gets the number of listeners of a song
 * @param {string} songId - The id of the song (eg. fc02ff53-4c18-48c2-9ec1-6ca4fdd46a37)
 * @returns {Promise<number>}
 */
function getSongListenerCount(songId) {
  const songsKey = getRedisKeyForSong(songId);
  return client.scardAsync(songsKey);
}

/**
 * Adds the user to the listeners of the given song
 * @param {string} clientId - The id of the client connected over websocket
 * @param {string} songId - The id of the song (eg. fc02ff53-4c18-48c2-9ec1-6ca4fdd46a37)
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

/**
 * Removes the given `clientId` from a given songs listeners
 * If `songId` is passed null, it will clear the last played song for that user
 * @param {string} clientId - The id of the client connected over websocket
 * @param {string} songId - The id of the song (eg. fc02ff53-4c18-48c2-9ec1-6ca4fdd46a37)
 */
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

/**
 * Subscribes to updates from Redis
 */
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
