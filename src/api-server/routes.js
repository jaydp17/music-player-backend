const restErrors = require('restify-errors');
const Promise = require('bluebird');
const axios = require('axios');
const { metaDataBaseUrl } = require('./config');
const s3Utils = require('./s3-utils');

module.exports = server => {
  server.get('/echo/:name', (req, res, next) => {
    res.send(req.params);
    return next();
  });

  server.get('/song/:id', async (req, res, next) => {
    const { id: songId } = req.params;
    const songStream = await s3Utils.getSongStream(songId);
    if (songStream) {
      songStream.pipe(res);
    } else {
      next(new restErrors.NotFoundError('stream not found'));
    }
  });

  /**
   * Gets the metaData from the MetaData server
   */
  const getMetaData = async songId => {
    const result = await axios.get(`${metaDataBaseUrl}/metaData/${songId}`);
    return result.data;
  };

  server.get('/songs-list', async (req, res, next) => {
    const songIds = await s3Utils.getSongIds();
    const songsList = await Promise.map(songIds, getMetaData);
    res.send(songsList);
    next();
  });
};
