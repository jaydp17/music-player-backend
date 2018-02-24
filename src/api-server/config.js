let metaDataBaseUrl = 'http://localhost:5000';
if (process.env.METADATA_HOST) {
  metaDataBaseUrl = `http://${process.env.METADATA_HOST}`;
}

module.exports = {
  s3Bucket: 'music-player-songs',
  metaDataBaseUrl,
  redisHost: process.env.REDIS_HOST || 'localhost',
};
