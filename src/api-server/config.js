const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  s3Bucket: 'music-player-songs',
  metaDataBaseUrl: isProd ? 'http://music-player-metadata.jaydp.com' : 'http://localhost:5000',
};
