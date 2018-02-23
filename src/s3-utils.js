const AWS = require('aws-sdk');
const { s3Bucket } = require('./config');

// AWS credentials are passed using env vars
const s3 = new AWS.S3();

/**
 * Given a S3Key it returns the stream to that object
 * else undefined
 */
function getSongStream(s3Key) {
  if (!s3Key) return undefined;
  return s3.getObject({ Bucket: s3Bucket, Key: s3Key }).createReadStream();
}

module.exports = { getSongStream };
