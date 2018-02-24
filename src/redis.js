const redis = require('redis');
const Promise = require('bluebird');

Promise.promisifyAll(redis.RedisClient.prototype);
// Promise.promisifyAll(redis.Multi.prototype);

const client = redis.createClient();
const sub = redis.createClient();

Promise.promisifyAll(redis.RedisClient.prototype);

const updatesChannelName = 'listeners-change';
sub.subscribe(updatesChannelName);

const getRedisKeyForClient = clientId => `users:${clientId}`;
const getRedisKeyForSong = songId => `songs:${songId}`;

function removeClientFromSongsSet({ songId, clientId }) {
  const lastSongsKey = getRedisKeyForSong(songId);
  client.srem(lastSongsKey, clientId);
}

async function startedListening(clientId, songId) {
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
    client.publish(updatesChannelName, lastSongId);
  }

  // set the song the client is listening to right now
  client.set(usersKey, songId);
  // publish update for songId
  client.publish(updatesChannelName, songId);
}

async function stoppedListening(clientId, songId) {
  const usersKey = getRedisKeyForClient(clientId);
  const lastSongId = await client.getAsync(usersKey);
  if (lastSongId) {
    // if lastSongId was found, remove client from the last song's set
    removeClientFromSongsSet({ songId: lastSongId, clientId });
  }
  if (songId && lastSongId !== songId) {
    // shouldn't happen, but in case there's some descripency in the data
    removeClientFromSongsSet({ songId, clientId });
  }
  // clear the song the client is listening to right now
  client.del(usersKey);

  // publish update for songId
  client.publish(updatesChannelName, lastSongId);
  if (songId && lastSongId !== songId) {
    client.publish(updatesChannelName, songId);
  }
}

async function onListenersChange(cb) {
  sub.on('message', async (channel, songId) => {
    if (channel !== updatesChannelName) return;
    const songsKey = getRedisKeyForSong(songId);
    const listenerCount = await client.scardAsync(songsKey);
    cb(null, { songId, listenerCount });
  });
}

module.exports = { startedListening, stoppedListening, onListenersChange };
