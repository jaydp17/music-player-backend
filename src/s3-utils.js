const AWS = require('aws-sdk');
const { s3Bucket } = require('./config');

// AWS credentials are passed using env vars
const s3 = new AWS.S3();

/**
 * Given a S3Key it determines if the file exists
 * @returns {Promise<boolean>}
 */
async function fileExists(s3Key) {
  if (!s3Key) return false;
  try {
    const result = await s3.headObject({ Bucket: s3Bucket, Key: s3Key }).promise();
    return !!result;
  } catch (error) {
    if (error.code !== 'NotFound') {
      console.error(`Error: fileExists - ${s3Key} `, error);
    }
    return false;
  }
}

/**
 * Given a S3Key it returns the stream to that object
 * else undefined
 */
async function getSongStream(s3Key) {
  if (!s3Key) return undefined;
  const exists = await fileExists(s3Key);
  if (!exists) return undefined;
  return s3.getObject({ Bucket: s3Bucket, Key: s3Key }).createReadStream();
}

module.exports = { getSongStream };
